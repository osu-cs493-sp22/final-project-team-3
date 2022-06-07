const { Router } = require('express')
const bcrypt = require('bcryptjs')

const {ValidateAgainstSchema, validateAgainstSchema} = require('../lib/validation')
const {UserSchema, insertNewUser,getUserById, validateUser, getStudentCourses, getInstructorCourses, getUserByEmail} = require('../models/user')

const {generateAuthToken, requireAuthentication, checkAuthentication} = require('../lib/auth')

const router = Router()

router.post('/', requireAuthentication, async function (req,res,next){
    console.log("req.user:",req.user)
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
        console.log(req.body.role)
        //const authHeader = req.headers.authorization
        //if(!authHeader){
        //    res.status(403).send({
        //        error: "Unauthorized to access the specified resource."
        //    })
        //}else{
            //console.log(authHeader)
            const requestingUser = req.user
            console.log(requestingUser)
            const permission = await getUserByEmail(requestingUser,false)
            console.log("permission:",permission)
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
        //}
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
            console.log("in authenticated")
            const user = await getUserByEmail(req.body.email,false)
            console.log(user)
            const token = generateAuthToken(user._id)
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
    console.log("GET permission:",permission)
    const target = await getUserById(req.params.id,false)
    console.log("GET target:",target.role)
    if(target.role === "instructor"){
        const coursesTaught = await getInstructorCourses(req.params.id)
        res.status(200).send(coursesTaught)
    }else if(target.role === "student" && (permission.email === target.email || permission.role === "admin")){
        const coursesTaking = await getStudentCourses(req.params.id)
        res.status(200).send({user: target, coursesEnrolled: coursesTaking})
    }else{
        console.log("something went wrong")
        res.status(403).send({
            error: "Unauthorized to access the specified resource."
        })
    }
})

module.exports = router