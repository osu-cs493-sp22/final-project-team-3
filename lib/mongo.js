const { MongoClient } = require('mongodb')

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
//const mongoUser = process.env.MONGO_USER
const mongoUser = 'tarpaulin'
//const mongoPassword = process.env.MONGO_PASSWORD
const mongoPassword = 'hunter2'
//const mongoDbName = process.env.MONGO_DB_NAME
const mongoDbName = 'tarpaulin'
//const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME || mongoDbName
const mongoAuthDbName = 'tarpaulin'

const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`

let db = null
let _closeDbConnection = null
exports.connectToDb = function (callback) {
  MongoClient.connect(mongoUrl, function (err, client) {
    if (err) {
      console.log("cant connect")
      throw err
    }
    db = client.db(mongoDbName)
    _closeDbConnection = function () {
      client.close()
    }
    callback()
  })
}

exports.getDbReference = function () {
  return db
}

exports.closeDbConnection = function (callback) {
  _closeDbConnection(callback)
}