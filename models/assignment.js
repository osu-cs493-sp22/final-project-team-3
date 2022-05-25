const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')
const { SubmissionSchema } = require('./submission')

const AssignmentSchema = {
    courseId:    {required: true},
    title:       {required: true},
    dueDate:     {required: true},
    submissions: {required: true}
}
exports.AssignmentSchema = AssignmentSchema

const EditableAssignmentSchema = {
    courseId:    {required: true},
    title:       {required: true},
    dueDate:     {required: true}
}
exports.EditableAssignmentSchema = EditableAssignmentSchema

exports.insertNewAssignment = async function insertNewAssignment(assignment){
    const db = getDbInstance()
    const collection = db.collection('assignments')
  
    assignment = extractValidFields(assignment, AssignmentSchema)
    const result = await collection.insertOne(assignment)
    return result.insertedId
}  

exports.insertNewSubmission = async function insertNewSubmission(submission){
    const db = getDbInstance()
    const collection = db.collection('submissions')
  
    submission = extractValidFields(submission, SubmissionSchema)
    const result = await collection.insertOne(submission)
    return result.insertedId
} 

exports.getAssignmentById = async function getAssignmentById(id) {
    const db = getDbInstance()
    const projection = {_id: 1, courseId: 1, title: 1, dueDate: 1, submissions: 0 }
    const collection = db.collection('assignments')
    const assignments = await collection.find({
        _id: new ObjectId(id)
    }).project(projection).toArray()
    return assignments[0]
}

exports.getAllSubmissions = async function getAllSubmissions(assignmentId, reqPage) {
    const db = getDbInstance()
    const projection = { submissions: 1 }
    const collection = db.collection('assignments')
    const assignments = await collection.find({
        _id: new ObjectId(assignmentId)
    }).project(projection).toArray()
    const submissions = assignments[0]

    // Pagination //
    let page = parseInt(reqPage) || 1;
    const numPerPage = 10;
    const lastPage = Math.ceil(submissions.length / numPerPage);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;

    const start = (page - 1) * numPerPage;
    const end = start + numPerPage;
    const pageSubmissions = submissions.slice(start, end);

    const links = {};
    if (page < lastPage) {
      links.nextPage = `/${assignmentId}/submissions?page=${page + 1}`;
      links.lastPage = `/${assignmentId}/submissions?page=${lastPage}`;
    }
    if (page > 1) {
      links.prevPage = `/${assignmentId}/submissions?page=${page - 1}`;
      links.firstPage = `/${assignmentId}/submissions?page=1`;
    }

    return {
        submissions: pageSubmissions,
        pageNumber: page,
        totalPages: lastPage,
        pageSize: numPerPage,
        totalCount: submissions.length,
        links: links
    }
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