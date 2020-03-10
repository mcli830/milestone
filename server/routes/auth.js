const router = require('express').Router();
const createError = require('http-errors');
const { User } = require('../models/index');

// constants
const sessionTokenCookieOptions = {
    maxAge: User.sessionDuration(),
    httpOnly: true,
}

const accessTokenCookieOptions = {
    maxAge: User.accessDuration(),
    httpOnly: true,
}

/* MIDDLEWARE */

// verify session token
const verifySession = (req, res, next) => {

    // grab _id from header and session token from cookies
    const _id = req.header('_id');
    const sessionToken = req.cookies['session-token'];

    // no id or session token
    if (!_id || !sessionToken) {
      return res.send(createError(401));
    }

    User.findByIdAndToken(_id, sessionToken).then(user => {
        // user not found
        if (!user) return Promise.reject({ message: 'User not found.' });

        // user and session found
        // attach user/token data to request for next middleware
        req.user = user;
        req.sessionToken = sessionToken;

        // verify session sessionToken has not expired
        const session = user.sessions.find(s => s.token === sessionToken);
        if (!session || User.hasSessionTokenExpired(session.expiry)) {
            // session has expired
            return Promise.reject(createError(401, "User session has expired."));
        }

        // session is still valid => continue
        next();

    }).catch(err => {
        next(err);
    });
}

/* ROUTES */

// register user
router.post('/users', (req, res) => {
    // create user instance from params
    const user = new User(req.body);

    // save new user -- validations handled by mongoose
    user.save().then(() => {
        // successful save => create new session
        return user.createSession();
        // return promise resolving with new sessionToken
    }).then(sessionToken => {
        // session created => generate access token for client
        return user.generateAccessAuthToken().then(accessToken => {
            // send both tokens to client
            return { accessToken, sessionToken };
        });
    }).then(({ accessToken, sessionToken }) => {
        // respond with auth tokens and user data
        res.cookie('session-token', sessionTokenCookieOptions)
           .cookie('access-token', accessToken, accessTokenCookieOptions)
           .send(user);

    }).catch(err => {
        res.status(401).send(err);
    });
});

// log in user
router.post('/users/login', (req, res) => {
    // get user login params
    const { email, password } = req.body;

    // find the login user
    User.findByCredentials(email, password).then(user => {
        // user found => create new session token
        return user.createSession().then(sessionToken => {
            // generate access auth token
            return user.generateAccessAuthToken().then(accessToken => {
                // send both tokens to client
                return { accessToken, sessionToken };
            });
        }).then(({ accessToken, sessionToken }) => {
            // respond with auth tokens and user data
            res.cookie('session-token', sessionToken, sessionTokenCookieOptions)
               .cookie('access-token', accessToken, accessTokenCookieOptions)
               .send(user);
        });
    }).catch(err => {
        res.status(401).send(err);
    });
});

// generate an access token for the client
router.get('/users/me/access-token', verifySession, (req, res, next) => {
    const user = req.user;

    user.generateAccessAuthToken().then(accessToken => {
        // send access token only in cookie for security
        res.cookie('access-token', accessToken, accessTokenCookieOptions)
           .send();

    }).catch(err => {
        res.status(401).send(err);
    });
});



module.exports = router;
