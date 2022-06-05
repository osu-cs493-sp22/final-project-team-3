const {ObjectId,GridFSBucket} = require('mongodb')
const bcrypt = require('bcryptjs')
const fs = require('fs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')
const { SubmissionSchema } = require('./submission')

const AssignmentSchema = {
    courseId:    {required: true},
    title:       {required: true},
    dueDate:     {required: true},
    points:      {required: true},
    submissions: {required: false}
}
exports.AssignmentSchema = AssignmentSchema

const EditableAssignmentSchema = {
    courseId:    {required: true},
    title:       {required: true},
    points:      {required: true},
    dueDate:     {required: true}
}
exports.EditableAssignmentSchema = EditableAssignmentSchema

exports.insertNewAssignment = async function insertNewAssignment(assignment){
    const db = getDbReference()
    const collection = db.collection('assignments')
  
    assignment = extractValidFields(assignment, AssignmentSchema)
    const result = await collection.insertOne(assignment)
    return result.insertedId
}  

exports.insertNewSubmission = async function insertNewSubmission(submission){
    const db = getDbReference()
    const collection = db.collection('submissions')
  
    submission = extractValidFields(submission, SubmissionSchema)
    const result = await collection.insertOne(submission)
    return result.insertedId
}

exports.insertNewSubmissionFile = async function insertNewSubmissionFile(submission){
    return new Promise(function(resolve,reject){
        const db = getDbReference()
        const bucket = new GridFSBucket(db, {bucketname: 'test'})
        const metadata = {
            assignmentId: submission.assignmentId,
            userId: submission.userId,
            timestamp: submission.timestamp,
            grade: submission.grade,
            url: submission.url
        }
        console.log("metadata: ", metadata)
        const uploadStream = bucket.openUploadStream(submission.filename, {
            metadata: metadata
        })
        fs.createReadStream(submission.path).pipe(uploadStream)
        .on('error',function(err){
           reject(err)
        })
        .on('finish',function(result) {
           console.log("== stream results: ", result)
           resolve(result._id)
        })
    })
} 

async function removeUploadedFile(file) {
    return new Promise((resolve, reject) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  exports.removeUploadedFile = removeUploadedFile

exports.getAssignmentById = async function getAssignmentById(id) {
    const db = getDbReference()
    const projection = {_id: 1, courseId: 1, title: 1, dueDate: 1, points: 1 }
    const collection = db.collection('assignments')
    const assignments = await collection.find({
        _id: new ObjectId(id)
    }).project(projection).toArray()
    return assignments[0]
}

exports.getSubmissionById = async function getSubmissionById(id) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, {bucketName: 'fs'})
    if (!ObjectId.isValid(id)) {
        console.log("NOT A VALID ID")
      return null
    } else {
        console.log("IS VALID ID")
      const results = await bucket
        .find({ _id: new ObjectId(id) })
        .toArray()
        console.log("RESULTS: ",results)
      return results[0]
    }
}

exports.getAllSubmissions = async function getAllSubmissions(assignmentId, reqPage) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, {bucketName: 'fs'})
    console.log("assignmentId ====================== ",assignmentId)
    const submissions = await bucket.find({assignmentId: assignmentId}).toArray()

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
    const db = getDbReference()
    const collection = db.collection('assignments')
  
    updatedAssignment = extractValidFields(updatedAssignment, AssignmentSchema)
    const result = await collection.updateOne({_id: ObjectId(id)}, {$set: updatedAssignment})
    return result
}

exports.deleteAssignmentById = async function deleteAssignmentById(id){
    const db = getDbReference()
    const collection = db.collection('assignments')
  
    const result = await collection.deleteOne({_id: ObjectId(id)})
    return result
}

exports.bulkInsertNewAssignments = async function bulkInsertNewAssignments(assignments){
    const assignmentsToInsert = assignments.map(function (assignment){
        const assignmentToInsert =  extractValidFields(assignment, AssignmentSchema)
        return assignmentToInsert
    })
    const db = getDbReference()
    const collection = db.collection('assignments')
    const result = await collection.insertMany(assignmentsToInsert)
    return result.insertedIds
}