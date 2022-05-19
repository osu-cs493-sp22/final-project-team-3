const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')

const AssignmentSchema = {
    courseId:           {required: true},
    title:              {required: true},
    dueDate:            {required: true},
    studentSubmissions: {required: true}
}
exports.AssignmentSchema = AssignmentSchema


exports.insertNewAssignment = async function insertNewAssignment(assignment){
    const db = getDbInstance()
    const collection = db.collection('assignments')
  
    assignment = extractValidFields(assignment, AssignmentSchema)
    const result = await collection.insertOne(assignment)
    return result.insertedId
}  
  
exports.getAssignmentById = async function getAssignmentById(id) {
    const db = getDbInstance()
    const collection = db.collection('assignments')
    const assignments = await collection.find({
        _id: new ObjectId(id)
    }).toArray()
    return assignments[0]
}

exports.updateAssignmentById = async function updateAssignmentById(id, updatedAssignment){
    const db = getDbInstance()
    const collection = db.collection('assignments')
  
    updatedAssignment = extractValidFields(updatedAssignment, AssignmentSchema)
    const result = await collection.updateOne({_id: ObjectId(id)}, {$set: updatedAssignment})
    return result
}

exports.deleteAssignmentById = async function deleteAssignmentById(id){
    const db = getDbInstance()
    const collection = db.collection('assignments')
  
    const result = await collection.deleteOne({_id: ObjectId(id)})
    return result
}