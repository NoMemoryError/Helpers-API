var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt');
//helper functions
function findById(id, fn) {
    Users.findOne(id).exec(function (err, user) {
        if (err) {
            return fn(null, null);
        } else {
            return fn(null, user);
        }
    });
}

function findByUsername(u, fn) {
    Users.findOne({
        username: u
    }).exec(function (err, user) {
            // Error handling
            if (err) {
                return fn(null, null);
                // The User was found successfully!
            } else {
                return fn(null, user);
            }
        });
}

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a username and password), and invoke a callback
// with a user object.
passport.use(new LocalStrategy(
    function (username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            // Find the user by username. If there is no user with the given
            // username, or the password is not correct, set the user to `false` to
            // indicate failure and set a flash message. Otherwise, return the
            // authenticated `user`.
            findByUsername(username, function (err, user) {
                console.log("Service-user", user);
                console.log("Service-err", err);
                if (err) {
                    // return done(null, err);
                    return done(err, false, {
                        status: 500,
                        message: 'Server error. Please contact administrator'
                    });
                }
                if (!user) {
                    return done(null, false, {
                        status: 204,
                        message: 'User does not exist'
                    });
                }

                bcrypt.compare(password, user.password, function (err, res) {
                    if (!res)
                        return done(null, false, {
                            status: 204,
                            message: 'Invalid Password'
                        });

                    if(user.config.emailVerification){
                        return done(null, false, {
                            status: 204,
                            message: 'Please verify your user'
                        });
                    }
                    // For jwt encryption
                    var unencryptedUser = {
                        username: user.username
                    };

                    // Modifying return object
                    var returnUser = {
                        username: user.username,
                        superuser: user.config.superUser,
                        token: unencryptedUser,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        id: user.id
                    };
                    return done(null, returnUser, {
                        message: 'Logged In Successfully'
                    });
                });
            })
        });
    }
));