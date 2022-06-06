const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')

const CourseSchema = {
    subject:          {required: true},
    number:           {required: true},
    title:            {required: true},
    instructorId:     {required: true},
    term:             {required: true},
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
        const results = await collection.find({_id: new ObjectId(id)}).toArray()
        return results[0]
    }
}

exports.getCourseById = getCourseById

async function getCoursesPage(page){
    const db = getDbReference()
    const projection = {_id: 1, subject : 1, number : 1, title : 1, instructorId : 1, term : 1}
    const collection = db.collection('courses')
    const count = await collection.countDocuments()

    const pageSize = 10
    const lastPage = Math.ceil(count / pageSize)
    page = page > lastPage ? lastPage : page
    page = page < 1 ? 1 : page
    const offset = (page - 1) * pageSize

    const results = await collection.find({}, {subjectCode: 1, number: 1, title: 1, instructorId: 1}).sort({_id:1}).skip(offset).limit(pageSize).toArray()

    return{
        courses: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    }
}

exports.getCoursesPage = getCoursesPage

async function insertNewCourse(course){
    const db = getDbReference()
    const collection = db.collection('courses')

    course = extractValidFields(course,CourseSchema)
    const result = await collection.insertOne(course)
    return result.insertedId
}

exports.insertNewCourse = insertNewCourse

async function getEnrolledStudents(id){
    db = getDbReference()
    const collection = db.collection('courses')

    results = await collection.find({"enrolledStudents": {$in:[new ObjectId(id)]}}).toArray()
    return results
}

exports.getEnrolledStudents = getEnrolledStudents

exports.bulkInsertNewCourses = async function bulkInsertNewCourses(courses){
    const coursesToInsert = courses.map(function (course){
        const courseToInsert =  extractValidFields(course, CourseSchema)
        return courseToInsert
    })
    const db = getDbReference()
    const collection = db.collection('courses')
    const result = await collection.insertMany(coursesToInsert)
    return result.insertedIds
}