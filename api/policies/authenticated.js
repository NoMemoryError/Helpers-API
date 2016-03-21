/**
 * Allow any authenticated user.
 */

var secret = "4bc878ccdaee57f77a7b844973a96041";
var jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {

    var token = req.headers.authorization;
    jwt.verify(token, secret, function(err, decoded){
        if(err){
            // Do proper error handling
            return res.json(401,{message: err.name});
        }
        var username = decoded.username;
        if(username == req.body.doctor.username) {
            next();
        } else {
            Users.find({username: username},{fields: {
                config: 1
            }}).exec( function(err, user){
                    console.log('FetchedUser', user);
                    if(user.length == 1) {
                        if(user[0].config.superUser){
                            next();
                        } else {
                            return res.json(401,{message: 'Unauthorized request'});
                        }
                    } else {
                        return res.json(401,{message: 'Unauthorized request'});
                    }
                });
        }
    });
};