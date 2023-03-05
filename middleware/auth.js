const jwt = require('jsonwebtoken');
const env= require('dotenv').config();

function auth(req,res,next) {
    const reqParams = req.query.token;
    const token = req.header('x-auth-token') || reqParams;
    if(!token){
       return res.status(401).send("access denied no token provided")
    }
    try{
        const decoded =jwt.verify(token,process.env.JWTKEY);
        // console.log(decoded);
        req.user=decoded
        next();
    }
    catch(ex){
        res.status(400).send("Invalid token")
    }
}
module.exports=auth