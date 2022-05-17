const { connectToDb, getDbReference, closeDbConnection } = require('./lib/mongo')
const { bulkInsertNewUsers } = require('./models/users')
//const { bulkInsertNewAssignments } = require('./models/assignments')
//const { bulkInsertNewCourses } = require('./models/courses')

const userData = require('./data/users.json')
const assignmentData = require('./data/assignments.json')
const courseData = require('./data/courses.json')


const mongoCreateUser = process.env.MONGO_CREATE_USER
const mongoCreatePassword = process.env.MONGO_CREATE_PASSWORD

connectToDb(async function () {
  /*
   * Insert initial business data into the database
   */
  const userIds = await bulkInsertNewUsers(userData)
  console.log("== Inserted users with IDs:", userIds)

  //const assignmentIds = await bulkInsertNewAssignments(assignmentData)
  //console.log("== Inserted assignments with IDs:", assignmentIds)

  //const courseIds = await bulkInsertNewCourses(courseData)
  //console.log("== Inserted courses with IDs:", courseIds)
  /*
   * Create a new, lower-privileged database user if the correct environment
   * variables were specified.
   */
  if (mongoCreateUser && mongoCreatePassword) {
    const db = getDbReference()
    const result = await db.addUser(mongoCreateUser, mongoCreatePassword, {
      roles: "readWrite"
    })
    console.log("== New user created:", result)
  }

  closeDbConnection(function () {
    console.log("== DB connection closed")
  })
})