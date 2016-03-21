/**
* Users.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    attributes: {
        username: {
            type: 'email',
            required: true,
            unique: true
        },

        password: {
            type: 'string',
            minLength: 5,
            required: true
        }
    },

    beforeUpdate: function (attrs, next) {
        console.log("Before Update", attrs);

        // validating before updating
        var validator = require('validator');
        var err = {
            status: 409,
            validationMessage: ''
        };

        var status;

        status = validator.isLength(validator.trim(attrs.firstName),1);
        if(!status) {
            err.validationMessage = 'Please provide First Name';
            next(err);
        }
        status = validator.isLength(validator.trim(attrs.lastName),1);
        if(!status) {
            err.validationMessage = 'Please provide Last Name';
            next(err);
        }
        status = validator.isDate(validator.trim(attrs.birthday));
        if(!status) {
            err.validationMessage = 'Please provide proper Date';
            next(err);
        }
        status = validator.isLength(validator.trim(attrs.description),1,300);
        if(!status) {
            err.validationMessage = 'Please provide the description under 300 letters';
            next(err);
        }
        status = validator.isLength(validator.trim(attrs.address.street),1);
        if(!status) {
            err.validationMessage = 'Please provide the Street address';
            next(err);
        }
        status = validator.isLength(validator.trim(attrs.address.city),1);
        if(!status) {
            err.validationMessage = 'Please provide the City';
            next(err);
        }
        status = validator.isLength(validator.trim(attrs.address.state),1);
        if(!status) {
            err.validationMessage = 'Please provide the State';
            next(err);
        }
        status = validator.isNumeric(validator.trim(attrs.address.zipcode));
        if(!status) {
            err.validationMessage = 'Please provide a proper zipcode';
            next(err);
        }
        status = validator.isEmail(validator.trim(attrs.contact.email));
        if(!status) {
            err.validationMessage = 'Please provide a proper email';
            next(err);
        }
        // Some more validations
        status = validator.isLength(validator.trim(attrs.service.type),1);
        if(!status) {
            err.validationMessage = 'Please provide a proper service type';
            next(err);
        }
        status = validator.isLength(validator.trim(attrs.service.description),1,300);
        if(!status) {
            err.validationMessage = 'Please provide the service description under 300 letters';
            next(err);
        }
        status = validator.isIn(validator.trim(attrs.plan.current),['basic','business','premium']);
        if(!status) {
            err.validationMessage = 'Current plan does not have proper value';
            next(err);
        }
        status = validator.isIn(validator.trim(attrs.plan.requested),['basic','business','premium','']);
        if(!status) {
            err.validationMessage = 'Requested plan does not have proper value';
            next(err);
        }
        next();
    },

    beforeCreate: function (attrs, next) {
        var bcrypt = require('bcrypt');
        console.log('Before Created');
        bcrypt.genSalt(10, function(err, salt) {
            if (err) return next(err);
            console.log(attrs);
            bcrypt.hash(attrs.password, salt, function(err, hash) {
                if (err) return next(err);

                attrs.password = hash;
                console.log(hash);
                var username = attrs.username;
                var hash = Users.hashCode(username);
                console.log(hash);
                attrs.config = {};
                attrs.config.emailVerification = hash.toString();
                attrs.config.profileStatus = 'incomplete';
                attrs.config.superUser = false;
                attrs.plan = {};
                attrs.plan.current = "basic";
                attrs.contact = {};
                attrs.contact.email = username;
                next();
            });
        });
    },

    hashCode : function(s){
        var hash = 0;
        if (s.length == 0) return hash;
        for (i = 0; i < s.length; i++) {
            char = s.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
};

