const { Router } = require('express')
const bcrypt = require('bcryptjs')

const {ValidateAgainstSchema, validateAgainstSchema} = require('../lib/validation')
const {UserSchema, insertNewUser,getUserById, validateUser, getStudentCourses, getInstructorCourses} = require('../models/users')

const {generateAuthToken, requireAuthentication, checkAuthentication} = require('../lib/auth')

const router = Router()

router.post('/', async function (req,res,next){

    if(req.body.role === "student"){
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
    }else if((req.body.role === "admin" || req.body.role === "instructor")){
        const requestingUser = await checkAuthentication()
        const permission = await getUserById(requestingUser,false)

        if(permission && permission.role === "admin"){
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
        }else{
            res.status(403).send({
                error: "Unauthorized to access the specified resource."
            })
        }
    }else{
        res.status(403).send({
            error: "Unauthorized to access the specified resource."
        })
    }
})

router.post('/login', async function (req, res){
    if(req.body && req.body.email && req.body.password){
        const authenticated = await validateUser(req.body.email,req.body.password)
        if(authenticated){
            try{
            const token = generateAuthToken(req.body.id)
            res.status(200).send({token: token})
            }catch (err){
                console.error(" -- Error:",err)
                res.status(500).send({
                    error: "Internal server error occurred."
                })
            }
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
    console.log("== req.user",req.user)

    const permission = await getUserById(req.user,false)
    const target = await getUserById(req.params.id,false)

    if(target.role === "instructor"){
        const coursesTaught = await getInstructorCourses(req.params.id)
        res.status(200).send(coursesTaught)
    }else if(target.role === "student" && (req.user === req.params.id || permission === "admin")){
        const coursesTaking = await getStudentCourses(req.params.id)
        res.status(200).send(coursesTaking)
    }else{
        res.status(403).send({
            error: "Unauthorized to access the specified resource."
        })
    }
})