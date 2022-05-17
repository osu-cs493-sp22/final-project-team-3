const jwt = require('jsonwebtoken')

const secret = "SuperSecret"

function generateAuthToken(userId) {
    console.log("token generate user id:",userId)
    const payload = { sub: userId }
    return jwt.sign(payload, secret, { expiresIn: '24h' })
}
exports.generateAuthToken = generateAuthToken


function requireAuthentication(req, res, next) {
    const authHeader = req.get('authorization') || ''
    const authParts = authHeader.split(' ')
    const token = authParts[0] === 'Bearer' ? authParts[1] : null

    try {
        const payload = jwt.verify(token, secret)
        console.log("== payload:", payload.sub)
        req.user = payload.sub
        console.log("verify success")
        next()
    } catch (err) {
        res.status(401).send({
            err: "Invalid authentication token"
        })
    }
}
exports.requireAuthentication = requireAuthentication

async function checkAuthentication(authHeader){
    //const authHeader = req.get('authorization') || ''
    const authParts = authHeader.split(' ')
    const token = authParts[0] === 'Bearer' ? authParts[1] : null
    console.log(token)
    try {
        const payload = jwt.verify(token, secret)
        console.log("== payload:", payload)
        returnval = payload.sub
        console.log("returnval: ",returnval)
        return returnval
    } catch (err) {
        res.status(401).send({
            err: "Invalid authentication token"
        })
    }
}
exports.checkAuthentication = checkAuthentication