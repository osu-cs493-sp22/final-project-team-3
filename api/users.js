const { Router } = require('express')
const bcrypt = require('bcryptjs')

const {ValidateAgainstSchema, validateAgainstSchema} = require('../lib/validation')
const {UserSchema, insertNewUser,getUserById} = require('../models/users')

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
            
        }
    }
})