const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')

const CourseSchema = {
    subjectCode:      {required: true},
    number:           {required: true},
    title:            {required: true},
    instructorId:     {required: true},
    enrolledStudents: {required: false},
    assignments:      {required: false}
}
exports.CourseSchema = CourseSchema

async function getCourseById(id){
    const db = getDbReference()
    const collection = db.collection('courses')
    if(!ObjectId.isValid(id)){
        return null
    }else{
        //console.log("id not null")
        const results = await collection.find({_id: new ObjectId(id)}).toArray()
        return results[0]
    }
}
exports.getCourseById = getCourseById