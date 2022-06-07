const { Router } = require('express')
const bcrypt = require('bcryptjs')

const multer = require('multer')
const crypto = require('crypto')

const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const { requireAuthentication } = require('../lib/auth')
const {
  AssignmentSchema,
  EditableAssignmentSchema,
  insertNewAssignment,
  insertNewSubmission,
  insertNewSubmissionFile,
  getAssignmentById,
  getAllSubmissions,
  updateAssignmentById,
  deleteAssignmentById,
  removeUploadedFile,
  getSubmissionById,
  getSubmissionDownloadStream
} = require('../models/assignment')

const {
    getUserById
} = require('../models/user')

const { getCourseById, getEnrolledStudents } = require('../models/course')
const req = require('express/lib/request')

const router = Router()


const fileTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png'
}
  
const upload = multer({ 
   storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: function(req, file, callback){
        const ext = fileTypes[file.mimetype]
        const filename = crypto.pseudoRandomBytes(16).toString('hex')
        callback( null ,`${filename}.${ext}`)
    }
   }),
    fileFilter: function (req, file, callback){
      callback(null, !!fileTypes[file.mimetype])
    }
})

async function isUserAuthorized(userId, courseId){
    console.log("==userId ", userId, " courseId ", courseId)
    const reqUser = await getUserById(userId, false)
    const course = await getCourseById(courseId)
    console.log("==reqUser ", reqUser)

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
  if(!isAuthorized){
    res.status(403).send({
        err: "User not Authorized"
    }) 
  }
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
  if(!isAuthorized){
    res.status(403).send({
        err: "User not Authorized"
    }) 
  }
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
  if(!isAuthorized){
    res.status(403).send({
        err: "User not Authorized"
    }) 
  }
  if(isAuthorized){
    await deleteAssignmentById(id)
  }
  res.status(204).send()
})

router.get('/:id/submissions', requireAuthentication, async function (req, res, next) {
    const id = req.params.id
    const assignment = await getAssignmentById(id)
    const isAuthorized = await isUserAuthorized(req.user, assignment.courseId)
    const submissions = await getAllSubmissions(id, req.query.page)
    if(!isAuthorized){
        res.status(403).send({
            err: "User not Authorized"
        }) 
      }
    if (submissions && isAuthorized) {
        res.status(200).send({submissions: submissions})
    } else {
        next()
    }
})
router.get('/submissions/:id', async function (req, res, next) {
    const id = req.params.id
    console.log("I AM IN THE SUBMISSION GET ID: ",id)
    const assignment = await getSubmissionById(id)
    if (assignment) {
        res.status(200).send(assignment)
    } else {
        next()
    }
  })

router.post('/:id/submissions', upload.single('submission'), requireAuthentication, async function (req, res, next) {
  if (req.file) {
      const submission = {
          assignmentId: req.body.assignmentId,
          userId: req.body.userId,
          timestamp: req.body.timestamp,
          path: req.file.path,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          grade: req.body.grade,
          url: `/${req.params.id}/submissions/download/${req.file.filename}`
      }
      //console.log("submission: ", submission)
      const id = await insertNewSubmissionFile(submission)
      //await removeUploadedFile(req.file)
      res.status(201).send({ id: id })
  } else {
      res.status(400).send({
          err: "Request body is not a valid Submission"
      })
  }
})

router.get('/:id/submissions/download/:filename',requireAuthentication, async function (req,res,next){
    const isAuthorized = await isUserAuthorized(req.user, req.body.courseId)
    if(isAuthorized){
        getSubmissionDownloadStream(req.params.filename)
            .on('file',function(file){
                res.status(200).type(file.filename)
            })
            .on('error',function (err){
                if(err.code === 'ENOENT'){
                    next()
                } else {
                    next(err)
                }
            })
            .pipe(res)
    }
    
})

module.exports = router