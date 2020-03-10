const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const validator = require('validator');
const { customLogger } = require('../lib/debug');
const { parseDuration } = require('../lib/time');

const sessionExpiryMs = parseDuration(process.env.SESSION_EXPIRY || "10d");
const accessExpiryMs = parseDuration(process.env.ACCESS_EXPIRY || "15m");

const checkpoint = customLogger('magenta', '[checkpoint]');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please use a valid email address.'],
    },
    name: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiry: {
            type: Number,
            required: true,
        }
    }]
});

/* MODEL METHODS */

// get user session token expiry duration
UserSchema.statics.sessionDuration = function() {
    return sessionExpiryMs;
}

// get user access token expiry duration
UserSchema.statics.accessDuration = function() {
    return accessExpiryMs;
}

// find instance by id and token
UserSchema.statics.findByIdAndToken = function(_id, sessionToken) {
    const User = this;

    // return promise with user document
    return User.findOne({
        _id,
        'sessions.token': sessionToken, // searches user.sessions[].token
    });
}

// find by credentials for login
UserSchema.statics.findByCredentials = function(email, password) {
    const User = this;

    return User.findOne({ email }).then(user => {
        // no user found
        if (!user) return Promise.reject({ message: 'User does not exist.' });
        // user found => compare passwords
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, same) => {
                if (err) return reject(err);

                if (same) {
                    // passwords match => success
                    resolve(user);
                } else {
                    // password incorrect
                    reject({ message: 'Password is incorrect.' });
                }
            });
        });
    });
}

UserSchema.statics.hasSessionTokenExpired = (expiry) => {
    checkpoint('Validating session token...');
    
    const currentTime = getCurrentTime(true); // ms => s

    const delta = expiry - currentTime;
    const expired = delta < 0;
    checkpoint(
        expired
            ? `Session token expired ${delta}(s) ago.`
            : `session token expires in ${delta}(s).`
    );

    // currentTime has passed expiry time => expired => true
    return expired;
}

/* MIDDLEWARE HOOKS */

// pre-save hook
UserSchema.pre('save', function(next) {
    const user = this;
    const saltRounds = 10; // cost and security level for bcrypt hash

    // if the password field has been edited/changed
    if (user.isModified('password')) {
        // generate salt and hash password
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err) return next(err);
            // successful salt => generate hash
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) return next(err);
                // update user password with hash
                user.password = hash;
                // continue with save
                checkpoint('New hash generated from user password');
                return next();
            });
        });
    }
    // no modifications => use next middleware
    return next();
});

// post save hook
UserSchema.post('save', function(doc, next) {
    checkpoint(`User:(${doc.email}) saved to database.`);
    next();
});

/* INSTANCE METHODS */

// overwrite UserSchema's toJSON method to prevent
// sensitive data from being exposed (eg. password)
UserSchema.methods.toJSON = function() {
    checkpoint('User instance used protected transform with toJSON()')
    const user = this.toObject();
    return _.omit(user, ['password', 'sessions']);
}

// generate token for authentication
UserSchema.methods.generateAccessAuthToken = function() {
    const user = this;

    return new Promise((resolve, reject) => {
        // create and return new JSON web token
        jwt.sign(
            // user payload
            { _id: user._id.toHexString() },
            // secret
            process.env.SECRET,
            // token options
            { expiresIn: accessExpiryMs },
            // callback
            (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    checkpoint('New access auth token generated.')
                    resolve(token);
                }
            }
        );
    });
}

// create new session and save it to user document
UserSchema.methods.createSession = function() {
    const user = this;

    return generateSessionAuthToken().then(sessionToken => {
        return saveSessionToDatabase(user, sessionToken);
    }).then(sessionToken => {
        // createSession method returns promise resolving with sessionToken
        return sessionToken;
    }).catch(err => {
        return Promise.reject(err);
    }); 
}

/* HELPER METHODS */

// generate token session auth token as 64byte hex string
function generateSessionAuthToken() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (err) {
                reject(err);
            } else {
                // success - convert buffer to token string
                const token = buf.toString('hex');
                checkpoint('New session auth token generated.')
                resolve(token);
            }
        });
    });
}

// save session with session token to database
function saveSessionToDatabase(user, sessionToken) {
    return new Promise((resolve, reject) => {
        let expiry = generateSessionTokenExpiryTime();
        
        // add session to user
        user.sessions.push({
            token: sessionToken,
            expiry,
        });

        // save user document
        user.save().then(() => {
            // session saved successfully
            checkpoint(`New session saved created for User:(${user.email}).`);
            resolve(sessionToken);
        }).catch(err => {
            reject(err);
        });
    });
}

// generate expiry time for session tokens
function generateSessionTokenExpiryTime() {
    return getCurrentTime(true) + sessionExpiryMs;
}

// gets current unix time
function getCurrentTime(floor = false) {
    let seconds = Date.now() / 1000; // ms to s
    return floor ? Math.floor(seconds) : seconds;
}

module.exports = mongoose.model('User', UserSchema);