const {ObjectId} = require('mongodb')
const bcrypt = require('bcryptjs')

const {extractValidFields} = require('../lib/validation')
const {getDbReference} = require('../lib/mongo')

const SubmissionSchema = {
    assignmentId: {required: true},
    userId:       {required: true},
    timestamp:    {required: true},
    mimetype:     {required: false},
    path:         {required: false},
    filename:     {required: false},
    grade:        {required: true}
}
exports.SubmissionSchema = SubmissionSchema