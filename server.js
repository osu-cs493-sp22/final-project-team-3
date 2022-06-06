//Final Project - Team 3
//CS 493
//Tarpaulin

const express = require('express')
const morgan = require('morgan')
const redis = require('redis')
const secret = "SuperSecret"
const jwt = require('jsonwebtoken')

const { connectToDb } = require('./lib/mongo')
const api = require('./api')

const app = express()
const port = process.env.PORT || 8000

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = process.env.REDIS_PORT || 6379

const redisClient = redis.createClient(redisHost,redisPort)

const rateLimitMaxRequestWithAuth = 30
const rateLimitMaxRequestWithoutAuth = 10
const rateLimitWindowMs = 60000

async function rateLimit(req,res,next){
  console.log("in rate limit")
  const ip = req.ip
  const authHeader = req.get('authorization')|| ''
  const authParts = authHeader.split(' ')
  const token = authParts[0] === 'Bearer' ? authParts[1] : null
  console.log("==token:",token)
  //const 
  let tokenBucket
  try{ //token rate limiting
    console.log("in first try block")
    const payload = jwt.verify(token,secret)
    console.log(" ==rateLimit payload verify:",payload)
    req.user = payload.sub
    try{
      tokenBucket = await redisClient.hGetAll(req.user)
    }catch(e){
      next()
      return
    }
    console.log("== Auth - tokenBucket before:",tokenBucket)
    tokenBucket = {
      tokens: parseFloat(tokenBucket.tokens)|| rateLimitMaxRequestWithAuth,
      last: parseInt(tokenBucket.last)||Date.now()
    }
    console.log("== Auth - tokenBucket after:",tokenBucket)

    const now = Date.now()
    const ellapsedMs = now - tokenBucket.last
    tokenBucket.tokens +=ellapsedMs*(rateLimitMaxRequestWithAuth/rateLimitWindowMs)
    tokenBucket.tokens = Math.min(rateLimitMaxRequestWithAuth,tokenBucket.tokens)
    tokenBucket.last = now

    if(tokenBucket.tokens >=1){
      tokenBucket.tokens -=1
      await redisClient.hSet(req.user,[['tokens',tokenBucket.tokens],['last',tokenBucket.last]])
      next()
    }else{
      await redisClient.hSet(req.user,[['tokens',tokenBucket.tokens],['last',tokenBucket.last]])
      res.status(429).send({
        err:"Too many requests per minute from authorized token"
      })
    }
  }catch(err){ //ip rate limiting, "err" as in no token existing
    console.log(err)
    try{
      tokenBucket = await redisClient.hGetAll(ip)
    }catch(e){
      next()
      return
    }
    console.log("== Non-Auth tokenBucket before:",tokenBucket)
    tokenBucket = {
      tokens: parseFloat(tokenBucket.tokens)|| rateLimitMaxRequestWithoutAuth,
      last: parseInt(tokenBucket.last)||Date.now()
    }
    console.log("== Non-Auth tokenBucket after:",tokenBucket)

    const now = Date.now()
    const ellapsedMs = now - tokenBucket.last
    tokenBucket.tokens +=ellapsedMs*(rateLimitMaxRequestWithoutAuth/rateLimitWindowMs)
    tokenBucket.tokens = Math.min(rateLimitMaxRequestWithoutAuth,tokenBucket.tokens)
    tokenBucket.last = now

    if(tokenBucket.tokens >=1){
      tokenBucket.tokens -=1
      await redisClient.hSet(ip,[['tokens',tokenBucket.tokens],['last',tokenBucket.last]])
      next()
    }else{
      await redisClient.hSet(ip,[['tokens',tokenBucket.tokens],['last',tokenBucket.last]])
      res.status(429).send({
        err:"Too many requests per minute from ip"
      })
    }
  }
}


app.use(rateLimit)

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'))

app.use(express.json())
app.use(express.static('public'))

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api)

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  })
})

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})

redisClient.connect().then(connectToDb(function () {
  app.listen(port, function () {
    console.log("== Server is running on port", port)
  })
})
)