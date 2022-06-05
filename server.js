//Final Project - Team 3
//CS 493
//Tarpaulin

const express = require('express')
const morgan = require('morgan')
const redis = require('redis')

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
  const ip = req.ip
  //const 
  let tokenBucket
  try{
    tokenBucket = await redisClient.hGetAll(ip)
  }catch(e){
    next()
    return
  }
  console.log("== tokenBucket before:",tokenBucket)
  tokenBucket = {
    tokens: parseFloat(tokenBucket.tokens)|| rateLimitMaxRequestWithoutAuth,
    last: parseInt(tokenBucket.last)||Date.now()
  }
  console.log("== tokenBucket after:",tokenBucket)

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
      err:"Too many requests per minute"
    })
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