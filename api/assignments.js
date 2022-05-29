const { Router } = require('express')
const bcrypt = require('bcryptjs')

const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const { requireAuthentication } = require('../lib/auth')
const {
  AssignmentSchema,
  EditableAssignmentSchema,
  insertNewAssignment,
  insertNewSubmission,
  getAssignmentById,
  getAllSubmissions,
  updateAssignmentById,
  deleteAssignmentById
} = require('../models/assignment')

const {
    getUserById
} = require('../models/user')

const { getCourseById, getEnrolledStudents } = require('../models/course')
const req = require('express/lib/request')

const router = Router()

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

async function isStudent(userId, courseId){
    const reqUser = await getUserById(userId, false)
    const enrolledStudents = await getEnrolledStudents(courseId)
    if(reqUser.role == "student"){
        enrolledStudents.forEach((student) => {
            if(student._id == userId){
                return true
            }
        })
        return false
    }
    return false
}

router.post('/', requireAuthentication, async function (req, res, next) {
  const isAuthorized = await isUserAuthorized(req.user, req.body.courseId)
  if (validateAgainstSchema(req.body, AssignmentSchema) && isAuthorized) {
      const id = await insertNewAssignment(req.body)
      res.status(201).send({ id: id })
  } else {
      res.status(400).send({
          err: "Request body is not a valid Assignment"
      })
  }
})

router.get('/:id', async function (req, res, next) {
  const id = req.params.id
  const assignment = await getAssignmentById(id)
  if (assignment) {
      res.status(200).send(assignment)
  } else {
      next()
  }
})

router.patch('/:id', requireAuthentication, async function (req, res, next) {
  const id = req.params.id
  const isAuthorized = await isUserAuthorized(req.user, req.body.courseId)
  // Cannot Edit Submissions within this endpoint
  if (validateAgainstSchema(req.body, EditableAssignmentSchema) && isAuthorized) {
    await updateAssignmentById(id, req.body)
    res.status(200).send({ AssignmentUpdated: "Assignment Sucessfully Updated!"})
} else {
    res.status(400).send({
        err: "Request body is not a valid Assignment"
    })
}

})

router.delete('/:id', requireAuthentication, async function (req, res, next) {
  const id = req.params.id
  const assignment = await getAssignmentById(id)
  const isAuthorized = await isUserAuthorized(req.user, assignment.courseId)
  if(isAuthorized){
    await deleteAssignmentById(id)
  }
  res.status(204).send()
})

router.get('/:id/submissions', requireAuthentication, async function (req, res, next) {
    const id = req.params.id
    const isAuthorized = await isUserAuthorized(req.user, assignment.courseId)
    const submissions = await getAllSubmissions(id, req.query.page)
    if (submissions && isAuthorized) {
        res.status(200).send({submissions: submissions})
    } else {
        next()
    }
})

router.post('/:id/submissions', requireAuthentication, async function (req, res, next) {
  const isAuthorized = await isStudent(req.user, req.body.courseId)
  if (validateAgainstSchema(req.body, AssignmentSchema) && isAuthorized) {
      const id = await insertNewSubmission(req.body)
      res.status(201).send({ id: id })
  } else {
      res.status(400).send({
          err: "Request body is not a valid Submission"
      })
  }
})

module.exports = router































module.exports = router