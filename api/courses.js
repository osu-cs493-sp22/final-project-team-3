const { Router } = require('express')
const bcrypt = require('bcryptjs')
const router = Router()

const {validateAgainstSchema, extractValidFields} = require('../lib/validation')
const {requireAuthentication} = require('../lib/auth')
const{
    CourseSchema,
    getCourseById
} = require('../models/assignment')

const { getUserById } = require('../models/user')

const { getCourseById } = require('../models/course')


const req = require('express/lib/request')

async function isUserAdmin(userId){
    const reqUser = await getUserById(userId, false)
    switch(reqUser.role){
        case "admin":
            return true
        default:
            return false    
    }
} 

async function isUserAuthorized(userId, courseId){
    const reqUser = await getUserById(userId, false)
    const course = await getCourseById(courseId)
    switch(reqUser.role){
        case "admin":
            return true
        case "instructor":
            if(course.instructorId == userId){
                return true
            } else {
                return false
            }
        default:
            return false    
    }
} 

/*
* GET list of all courses
*/
router.get('/', async function(req,res,next){
    try{
        const coursesPage = await getCoursesPage(parseInt(req.query.page) || 1)
        coursesPage.links = {}
        if(coursesPage.page < coursesPage.totalPages){
            coursesPage.links.nextPage = `/courses?page=${coursesPage.page+1}`
            coursesPage.links.lastPage = `/courses?page=${coursesPage.totalPages}`
        }
        if(coursesPage.page > 1){
            coursesPage.links.prevPage = `/courses?page=${coursesPage.page - 1}`
            coursesPage.links.firstPage = '/courses?page=1'
        }
        res.status(200).send(coursesPage)
    }catch (err){
        console.error(err)
        res.status(500).send({
            error: "Error fetching courses list. Please try again later"
        })
    }
})

/*
* POST - create a new course
*/

router.post('/', requireAuthentication, async function (req,res,next){
    const isAuthorized = await isUserAdmin(req.user)
    if(isAuthorized){
        if(validateAgainstSchema(req.body,CourseSchema)){
            const id = await insertNewCourse(req.body)
            res.status(201).send({id: id})
        }else{
            res.status(400).send({
                err: "Request body is not a valid course"
            })
        }
    }else{
        res.status(403).send({
            err: "Requesting user is not authorized for this action"
        })
    }
})



router.get("/:id/students",requireAuthentication,async function(req,res,next){
    const id = req.params.id
    const isAuthorized = await isUserAuthorized(req.user, id)
    if(isAuthorized){
        const studentsEnrolled = await getEnrolledStudents(id)
        res.status(200).send({students: studentsEnrolled})
    }else{
        res.status(403).send({
            err: "Requesting user is not authorized for this action"
        })
    }
})





















module.exports = router