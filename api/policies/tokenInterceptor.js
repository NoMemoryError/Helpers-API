/**
 * tokenInterceptor
 *
 * @module      :: Policy
 * @description :: Simple policy to intercept the token
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
    if(req.headers.authorization){
        next();
    } else {
        return res.json(401,{message: 'Unauthorized request'});
    }
}