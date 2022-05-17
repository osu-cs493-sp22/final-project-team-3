const { Router } = require('express')
const bcrypt = require('bcryptjs')

const {ValidateAgainstSchema, validateAgainstSchema} = require('../lib/validation')
const {UserSchema, insertNewUser,getUserById, validateUser} = require('../models/users')

const {generateAuthToken, requireAuthentication} = require('../lib/auth')

const router = Router()

router.post('/', async function (req,res,next){
    if(validateAgainstSchema(req.body,UserSchema)){
        try{
            const id = await insertNewUser(req.body)
            res.status(201).send({
                _id: id
            })
        }catch (err){
            console.error(" -- Error:",err)
            res.status(500).send({
                error: "Error inserting new user. Try again later."
            })
        }
    }else{
        res.status(400).send({
            error: "Request body does not contain a valid User."
        })
    }
})

router.post('/login', async function (req, res){
    if(req.body && req.body.email && req.body.password){
        const authenticated = await validateUser(req.body.email,req.body.password)
        if(authenticated){
            const token = generateAuthToken(req.body.id)
            res.status(200).send({token: token})
        }else{
            res.status(401).send({
                error: "Invalid credentials."
            })
        }
    }else{
        res.status(400).send({
            error: "Request needs email and password"
        })
    }
})

router.get('/:id', requireAuthentication, async function (req, res, next){
    
})