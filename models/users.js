const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')

const UserSchema = {
    name:       {required: true},
    email:      {required: true},
    password:   {required: true},
    role:       {required: true}
}
exports.UserSchema = UserSchema

async function insertNewUser(user){
    const userToInsert = extractValidFields(user,UserSchema)
    userToInsert.password = await bcrypt.hash(userToInsert.password,8)
    console.log("== Hashed, salted password: ",userToInsert.password)
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertOne(userToInsert)
    return result.insertedId
}
exports.insertNewUser = insertNewUser

async function getUserById(id, includePassword){
    const db = getDbReference()
    const collection = db.collection('users')
    if(!ObjectId.isValid(id)){
        return null
    }else{
        //console.log("id not null")
        const results = await collection.find({_id: new ObjectId(id)}).project(includePassword ? {}: {password:0}).toArray()
        return results[0]
    }
}
exports.getUserById = getUserById

async function validateUser(email,password){
    const db = getDbReference()
    const collection = db.collection('users')
    const user = await collection.find({email: email}).toArray()
    console.log(user)
    const authenticated = user[0] && await bcrypt.compare(password,user[0].password)
    return authenticated
}
exports.validateUser = validateUser

async function bulkInsertNewUsers(users){
    const usersToInsert = users.map(function (user){
        const userToInsert =  extractValidFields(user,UserSchema)
        userToInsert.password = bcrypt.hashSync(userToInsert.password,8)
        return userToInsert
    })
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertMany(usersToInsert)
    return result.insertedIds
}
exports.bulkInsertNewUsers = bulkInsertNewUsers

async function getInstructorCourses(id){
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.find( {instructorId: new ObjectId(id)}, {subject:0,number:0,title:0,term:0,enrolled:0,assignments:0}).toArray()
    return results
}
exports.getInstructorCourses = getInstructorCourses

async function getStudentCourses(id){
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.find({"enrolled": {$in:[new ObjectId(id)]}},{subject:0,number:0,title:0,term:0,instructorId:0,assignments:0}).toArray()
    return results
}
exports.getStudentCourses = getStudentCourses

async function getUserByEmail(passedEmail, includePassword){
    const db = getDbReference()
    const collection = db.collection('users')
    console.log("about to get results")
    const results = await collection.find({email: passedEmail}).project(includePassword ? {}: {password:0}).toArray()
    console.log("get by email results:",results[0])
    return results[0]

}
exports.getUserByEmail = getUserByEmail
