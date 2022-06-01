const { Router } = require('express')
const bcrypt = require('bcryptjs')
const router = Router()

const {validateAgainstSchema, extractValidFields} = require('../lib/validation')
const {requireAuthentication} = require('../lib/auth')

const { getUserById } = require('../models/user')

const { CourseSchema, EditableCourseSchema, getCourseById, updateCourseById,deleteCourseById, getCoursesPage, insertNewCourse, getEnrolledStudents, updateEnrolledStudents, getCourseAssignments, getCourseRoster } = require('../models/course')


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
    const course = await getCourseById(id)
    if(course){
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
    } else{
        next()
    }
    
})

/*
 * /Courses/{id} Endpoints
*/

router.get("/:id", async function(req,res,next){
    const id = req.params.id
    const course = await getCourseById(id)
    if(course) {
        res.status(200).send(course)
    } else {
        next()
    }
})

router.patch("/:id", requireAuthentication, async function(req,res,next){
    const id = req.params.id
    const isAuthorized = await isUserAuthorized(req.user,id)
    const course = await getCourseById(id)
    if(course){
        if(isAuthorized) {
            if (validateAgainstSchema(req.body, EditableCourseSchema)) {
                await updateCourseById(id, req.body)
                res.status(200).send({ CourseUpdated: "Course Sucessfully Updated!"})
            } else {
                res.status(400).send({
                    err: "Request body is not a valid Course"
                })
            }
        } else {
            res.status(403).send({
                err: "Requesting user is not authorized for this action"
            })
        }
    } else{
        next()
    }
    
    
})

router.delete("/:id", requireAuthentication, async function(req,res,next){
    const id = req.params.id
    const isAuthorized = await isUserAuthorized(req.user,id)
    const course = await getCourseById(id)
    if(isAuthorized) {
        if (course) {
            await deleteCourseById(id)
            res.status(204).send({ CourseDeleted: "Course Sucessfully Deleted!"})
        } else {
            next()
        }
    } else {
        res.status(403).send({
            err: "Requesting user is not authorized for this action"
        })
    }
    
})



router.get("/:id/students",requireAuthentication,async function(req,res,next){
    const id = req.params.id
    const isAuthorized = await isUserAuthorized(req.user, id)
    const course = await getCourseById(id)
    if(course){
        if(isAuthorized){
            const studentsEnrolled = await getEnrolledStudents(id)
            res.status(200).send(studentsEnrolled)
        }else{
            res.status(403).send({
                err: "Requesting user is not authorized for this action"
            })
        }
    } else{
        next()
    }
    
})

router.post("/:id/students",requireAuthentication,async function(req,res,next){
    const id = req.params.id
    const course = await getCourseById(id)
    if(course){
        if(req.body.enrolledStudents){
            // const change = req.body.change
            const updater = req.body.enrolledStudents.toString()
            const updaterlist = updater.split(',')
            console.log("===== updater: ", updater) 
            const isAuthorized = await isUserAuthorized(req.user, id)
            if(isAuthorized){
                const studentsEnrolled = await updateEnrolledStudents(id,updaterlist)
                res.status(200).send({enrolledStudents: studentsEnrolled})
            }else{
                res.status(403).send({
                    err: "Requesting user is not authorized for this action"
                })
            }
        } else {
            res.status(400).send({err: "need a change and an enrolledStudents in request body"})
        }
    } else {
        next()
    }  
})

router.get("/:id/assignments",async function (req,res,next){
    const id = req.params.id
    const course = await getCourseById(id)
    if(course){
        const assignments = await getCourseAssignments(id)
        res.status(200).send({assignments: assignments})
    } else {
        next()
    }
})

router.get("/:id/roster",requireAuthentication,async function (req,res,next){
    const id = req.params.id
    const course = await getCourseById(id)
    const isAuthorized = await isUserAuthorized(req.user, id)
    if(course){
        if(isAuthorized){
            const roster = await getCourseRoster(id)
            res.status(200).send(`${roster}`)
        }else{
            res.status(403).send({
                err: "Requesting user is not authorized for this action"
            })
        }
        
    } else {
        next()
    }
})




















module.exports = router