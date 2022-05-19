const { Router } = require('express')
const bcrypt = require('bcryptjs')

const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const {
  AssignmentSchema,
  insertNewAssignment,
  getAssignmentById,
  updateAssignmentById,
  deleteAssignmentById
} = require('../models/assignment')

const router = Router()

router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, AssignmentSchema)) {
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

router.patch('/:id', async function (req, res, next) {
  const id = req.params.id
  if (validateAgainstSchema(req.body, AssignmentSchema)) {
    await updateAssignmentById(id, req.body)
    res.status(200).send({ AssignmentUpdated: "Assignment Sucessfully Updated!"})
} else {
    res.status(400).send({
        err: "Request body is not a valid Assignment"
    })
}

})

router.delete('/:id', async function (req, res, next) {
  const id = req.params.id
  await deleteAssignmentById(id)
  res.status(204).send()
})

module.exports = router































module.exports = router