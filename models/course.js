const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')

const CourseSchema = {
    subject:      {required: true},
    number:           {required: true},
    title:            {required: true},
    instructorId:     {required: true},
    term:             {required: true},
    enrolledStudents: {required: true},
    assignments:      {required: false}
}
exports.CourseSchema = CourseSchema

const EditableCourseSchema = {
    subject:      {required: true},
    number:           {required: true},
    title:            {required: true},
    term:             {required: true},
    instructorId:     {required: true}
}
exports.EditableCourseSchema = EditableCourseSchema

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

async function updateCourseById(id, updatedCourse){
    const db = getDbReference()
    const collection = db.collection('courses')
  
    updatedCourse = extractValidFields(updatedCourse, CourseSchema)
    const result = await collection.updateOne({_id: ObjectId(id)}, {$set: updatedCourse})
    return result
}
exports.updateCourseById = updateCourseById

async function deleteCourseById(id){
    const db = getDbReference()
    const collection = db.collection('courses')

    const result = await collection.deleteOne({_id: ObjectId(id)})
    return result
}
exports.deleteCourseById = deleteCourseById

async function getCoursesPage(page){
    const db = getDbReference()
    const projection = {_id: 1, subjectCode : 1, number : 1, title : 1, instructorId : 1, enrolledStudents : 0, assignments : 0}
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

    results = await collection.find({_id: ObjectId(id)}).project({_id: 0,subject:0,instructorId:0,number:0,title:0,term:0}).toArray()
    console.log(results)
    return results
}
exports.getEnrolledStudents = getEnrolledStudents

async function updateEnrolledStudents(id, updatedEnrolledStudents,change){
    db = getDbReference()
    const collection = db.collection('courses')
    var result

    const update = updatedEnrolledStudents
    console.log(update)
    if(change === 'add'){
        for(var i in update){
            result = await collection.updateMany({_id: ObjectId(id)}, {$push: {"enrolledStudents":update[i]}})
        }
    } else {
        for(var i in update){
            result = await collection.updateMany({_id: ObjectId(id)}, {$pull: {"enrolledStudents": update[i]}})
        }
    }
    
    
    
    return result
}
exports.updateEnrolledStudents = updateEnrolledStudents

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

async function getCourseAssignments(id) {
    db = getDbReference()
    const collection = db.collection('assignments')
    const projection = {_id: 1, title: 1, dueDate: 1, points: 1 }

    const assignments = collection.find({courseId: id}).project(projection).toArray()
    return assignments
}
exports.getCourseAssignments = getCourseAssignments

async function getCourseRoster(id) {
    db = getDbReference()
    const courseCollection = db.collection('courses')
    const userCollection = db.collection('users')
    var finalString = ''

    const course = await courseCollection.find({_id: new ObjectId(id)}).project({_id: 0,subject:0,instructorId:0,number:0,title:0,term:0}).toArray()
    const testString = JSON.stringify(course)
    const testStringArray = testString.split('[').join(',').split(']').join(',').split(',')
    testStringArray.shift()
    testStringArray.shift()
    testStringArray.pop()
    testStringArray.pop()
    for(var i in testStringArray){
        const justTheHex = testStringArray[i].slice(1,-1)
        console.log("testStringArray[i] ================================ ", justTheHex)
        const testId = new ObjectId(justTheHex)
        var test = await userCollection.find({_id: testId}).project({_id:1,name:1,email:1}).toArray()
        console.log("first enrolled student ================================ ", test)
        const array = JSON.stringify(test).split(':').join(',').split('}').join(',').split(',')
        console.log("array ================================ ", array) 
        const arrayToInsert = array.filter((element,index) => {
            return index % 2 === 1
        })
        console.log("arrayToInsert ================================ ", arrayToInsert)
        finalString += arrayToInsert.join(',')
        finalString += "\n" 
    }
    console.log("final String ================================ ", finalString)
    
    return finalString
}
exports.getCourseRoster = getCourseRoster