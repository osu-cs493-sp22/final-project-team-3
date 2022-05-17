const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation.')
const {getDBReference} = require('../lib/mongo')

const UserSchema = {
    name:       {required: true},
    email:      {required: true},
    password:   {required: true},
    role:       {required: true}
}
exports.UserSchema = UserSchema

exports.insertNewUser = async function (user){
    const userToInsert = extractValidFields(user,UserSchema)
    userToInsert.password = await bccrypt.hash(userToInsert.password,8)
    console.log("== Hashed, salted password: ",userToInsert.password)
    const db = getDBReference()
    const collection = db.collection('users')
    const result = await collection.insertOne(userToInsert)
    return result.insertedId
}

exports.getUserById = async function (id, includePassword){
    const db = getDBReference()
    const collection = db.collection('users')
    if(!ObjectId.isValid(id)){
        return null
    }else{
        const results = await collection.find({_id: new ObjectId(id)}).project(includePassword ? {}: {password:0}).toArray()
        return results[0]
    }
}