const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    password: String,
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true,
        }
    }]
});

/* MODEL METHODS */

// find instance by id and token
UserSchema.statics.findByIdAndToken = function(_id, token) {
    const User = this;

    return User.findOne({
        _id,
        'sessions.token': token, // searches instance.sessions[{ token }]
    });
}

// find by credentials for login
UserSchema.statics.findByCredentials = function(email, password) {
    const User = this;

    return User.findOne({ email }).then(user => {
        // no user found
        if (!user) return Promise.reject();
        // user found => compare passwords
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, same) => {
                // passwords match => success
                if (same) resolve(user);
                reject();
            });
        });
    });
}

UserSchema.statics.hasRefreshTokenExpired = (expiresAt) => {
    let currentTime = Date.now() / 1000; // ms => s

    if (expiresAt > currentTime) {
        // refresh token still valid
        return false;
    }
    // refresh token has expired
    return true;
}

/* INSTANCE METHODS */

// overwrite UserSchema's toJSON method to prevent
// sensitive data from being exposed (eg. password)
UserSchema.methods.toJSON = function() {
    const user = this.toObject();
    return _.omit(user, ['password', 'sessions']);
}

// add pre save hook
UserSchema.pre('save', function(next) {
    const user = this;
    const saltRounds = 10; // cost and security level for bcrypt hash

    // if the password field has been edited/changed
    if (user.isModified('password')) {
        // generate salt and hash password
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err) next(err);
            // successful salt => generate hash
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) next(err);
                // update user password with hash
                user.password = hash;
                // continue with save
                next();
            });
        });
    }
});

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
            { expiresIn: "15m" },
            // callback
            (err, token) => {
                if (!err) {
                    resolve(token);
                } else {
                    reject();
                }
            }
        );
    });
}

// generate token auth refresh token as 64byte hex string
UserSchema.methods.generateRefreshAuthToken = function() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (!err) {
                // success - convert buffer to token string
                const token = buf.toString('hex');
                return resolve(token);
            } else {
                reject();
            }
        });
    });
}

UserSchema.methods.createSession = function() {
    const user = this;

    return user.generateRefreshAuthToken.then(refreshToken => {
        return saveSessionToDatabase(user, refreshToken);
    }).then(refreshToken => {
        // createSession method returns promise resolving with refreshToken
        return refreshToken;
    }).catch(err => {
        return Promise.reject('Failed to save session to database.\n' + err);
    }); 
}

/* HELPER METHODS */

// save session with refresh token to database
// (helps user.createSession)
function saveSessionToDatabase(user, refreshToken) {
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiryTime();
        
        // add session to user
        user.sessions.push({
            token: refreshToken,
            expiresAt,
        });

        // save user document
        user.save().then(() => {
            // session saved successfully
            return resolve(refreshToken);
        }).catch(err => {
            reject(err);
        });
    });
}

// generate expiry time for refresh tokens
// (helps saveSessionToDatabase)
function generateRefreshTokenExpiryTime() {
    let daysUntilExpire = "10";
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60 + 60);
    let currentTime = Date.now() / 1000; // Convert ms to s
    return currentTime  + secondsUntilExpire;
}

module.exports = mongoose.model('User', UserSchema);