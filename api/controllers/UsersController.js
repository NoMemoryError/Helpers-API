/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var secret = "4bc878ccdaee57f77a7b844973a96041";
var jwt = require('jsonwebtoken');
module.exports = {
    list: function (req, res) {
        /**
         * This is just a solution from stackoverflow to fetch selected fields as it not yet implemented by waterline
         * For details check http://stackoverflow.com/questions/24068176/specify-returned-fields-in-node-js-waterline
         */
        Users.find({ $and: [{'config.profileStatus': {$ne: 'incomplete'}},{'config.profileStatus': {$exists: true}}]}, {fields: {
            firstName: 1,
            lastName: 1,
            description: 1,
            username: 1,
            service: 1,
            profile: 1,
            address: 1,
            config: 1,
            plan: 1
        }}).exec(function(err,allusers){
                if(err) {
                    console.log('Error',err);
                    return res.json({});
                }
                // console.log(allusers);
                return res.json(allusers);
            });
    },

    signup: function(req, res) {
        console.log(req.body);
        Users.create(req.body).exec(function(err,user){
            if(err) {
                console.log('Error', err);
                return res.json(409,{message: 'duplicate'});
            }
            console.log(user);
            if(user) {
                var hash = user.config.emailVerification;
                EmailService.sendInviteEmail({email: user.username, hashId: hash});

                return res.json(201,{message:'success'});
            }
        });
    },

    emailVerification: function(req, res) {
        console.log(req.params.id);
        var hashId = req.params.id;
        if(hashId) {
            Users.find({where:{'config.emailVerification':hashId}}).exec( function(err, user){
                if(err){
                    return res.json(500,{message: 'Invalid hash'});
                }

                if(user && user.length>0){
                    console.log(user);
                    Users.update({'config.emailVerification':hashId}, {
                        'config.emailVerification':''
                    }).exec(function(err, user){
                            if(err){
                                console.log(err);
                                return res.json(500,{message: 'Internal Server error. Please contact administrator'});
                            }
                            console.log(user);
                            return res.redirect("http://localhost:63342/heilpraxix_client/#/");
                        });
                } else {
                    return res.json(500,{message: 'Invalid hash'});
                }
            });
        } else {
            return res.json(500,{message: 'Please provide a hash'});
        }
    },

    login: function(req, res) {
        console.log(req.body);
        var passport = require('passport');
        passport.authenticate('local', function(err, user, info) {
            console.log("Controller-user",user);
            console.log("Controller-err",err);
            console.log("Controller-info",info);
            if ((err) || (!user)) {
                return res.json(200,{
                    message: info.message
                });
            }
            req.logIn(user, function(err) {
                if (err) return res.send(500, {
                    message: 'Login Failed'
                });

                // Handling token Logic
                console.log(user.token);
                var token = jwt.sign(user.token, secret, { expiresInMinutes: 60*5 });
                user.token = token;
                console.log(user);
                return res.json(200, user);
            });
        })(req, res);
    },

    logout: function (req,res){
        req.logout();
        res.send('logout successful');
    },

    detail: function (req, res) {
        var detailId = req.body._id;
        console.log(detailId);
        Users.find({ id:detailId }, { fields: {
            username: 1,
            firstName: 1,
            lastName: 1,
            plan: 1,
            contact: 1,
            birthday: 1,
            address: 1,
            service: 1,
            description: 1
        }}).exec( function(err, user){
                if(err) {
                    console.log('Error',err);
                    return res.json({});
                }
                console.log(user);
                return res.json(user);
            });
    },

    update: function (req, res) {
        // Handle authorization
        console.log(req.body);
        var doctor = req.body.doctor;
        var requestedPlan = req.body.requestedPlan;

        if( requestedPlan != 'No Change' && requestedPlan != doctor.plan.current) {
            doctor.plan.requested = requestedPlan;
        }

        // Finding the config of user
        Users.find({ username: doctor.username }, { fields: {
            config: 1
        }}).exec( function(err, user){
                if(err) {
                    console.log('Error',err);
                    // handle error handling
                    return res.json(500,{message: "Internal Server error. Please contact administrator"});
                }
                doctor.config = user[0].config;
                doctor.config.profileStatus = 'complete';
                console.log(doctor);
                // Updating the db
                Users.update({username: doctor.username}, doctor, function(err, user){
                    if(err){
                        console.log("Error", err);
                        if(err.validationMessage) {
                            return res.json(409,{message: err.validationMessage});
                        } else {
                            return res.json(500,{message: "Internal Server error. Please contact administrator"});
                        }
                    }
                    console.log(user);
                    return res.json(200, {message: 'success'});
                });
            });
    },

    search: function (req, res) {
        var criteria = req.body.criteria;
        console.log(criteria);
        var zipcode = criteria.zipCode.toString();
        var query;
        if( criteria.advanceSearch == -1 && criteria.zipCode == -1) {
            query = { $and: [{'config.profileStatus': {$ne: 'incomplete'}},{'config.profileStatus': {$exists: true}}]};
        } else {
            query = { or: [{description: { 'like': '%' + criteria.advanceSearch + '%'}},
                {lastName: { 'like': '%' + criteria.advanceSearch + '%'}},
                {'service.type': {'like': '%' + criteria.advanceSearch + '%'}},
                {'address.zipcode': zipcode} ]};
        }

        //TODO: Didn't implement the and condition yet
        //TODO: Check this logic with aggregate as well
        Users.find( query, { fields: {
            firstName: 1,
            lastName: 1,
            description: 1,
            username: 1,
            service: 1,
            profile: 1,
            address: 1,
            config: 1,
            plan: 1
        }}).exec( function(err, users){
                if(err) {
                    console.log('Error',err);
                    return res.json(500, {message: 'Internal Server error. Please contact administrator'});
                }
                var returnedUser = [];
                _.each(users, function(user) {
                    if(!user.config.superUser)
                        returnedUser.push(user);
                });
                return res.json(200, {result: returnedUser, message:'success'});
            });
    },

    approve : function(req, res) {
        var username = req.body.username;
        console.log(username);

        Users.find({ username: username }).exec( function(err, users){
                if(err) {
                    console.log('Error',err);
                    return res.json(500, {message: 'Internal Server error. Please contact administrator'});
                }
                if(users && users.length>0){
                    var user = users[0];
                    console.log('Before', user);
                    user.plan.current = user.plan.requested;
                    user.plan.requested = '';
                    console.log('After', user);
                    Users.update({username: user.username}, user, function(err, user){
                        if(err){
                            console.log("Error", err);
                            return res.json(500,{message: "Internal Server error. Please contact administrator"});
                        }
                        console.log(user);
                        return res.json(200, {message: 'success'});
                    });
                    return res.json(200,{message: 'success'});
                } else {
                    console.log('No results for this user');
                    return res.json(200,{message: 'success'});
                }
            });
    }
};