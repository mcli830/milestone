const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/user');

module.exports = function() {

    // use local strategy
    passport.use(new LocalStrategy((email, password, done) => {
        User.findOne({ email }, (err, user) => {
            // on error
            if (err) return done(err);
            // on no user match
            // or password incorrect
            if (!user || !user.verifyPassword(password)) {
                return done(null, false);
            }
            // verified => return user
            return done(null, user);
        });
    }));
    
    // serialization to session
    passport.serializeUser((user, done) => {
        done(null, user._id);
    })
    // deserialization from session
    passport.deserializeUser((id, done) => {
        console.log('Passport deserialize id: ' + id);
        User.findById(id, (err, user) => {
            done(null, user);
        });
    });

}