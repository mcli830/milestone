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

    // grab _id from header and session from cookies
    const user_id = req.cookies['user-id'];
    const sessionToken = req.cookies['session-token'];

    // no id or session token
    if (!user_id || !sessionToken) {
      return next(createError(401, 'User not logged in.'));
    }

    User.findByIdAndToken(user_id, sessionToken).then(user => {
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
router.post('/users', (req, res, next) => {
    // create user instance from params
    const user = new User(req.body);

    // check if user already exists
    User.findOne({ email: user.email }, (err, doc) => {
        if (err) return next(err);

        // user already exists
        if (doc) return next(createError(403, 'Email is already registered.'));

        // email is available -> save new user -> validations handled by mongoose
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
            res.cookie('user-id', user._id, sessionTokenCookieOptions)
               .cookie('session-token', sessionToken, sessionTokenCookieOptions)
               .cookie('access-token', accessToken, accessTokenCookieOptions)
               .send(user);
    
        }).catch(err => {
            next(err);
        });
    });

});

// log in user
router.post('/users/login', (req, res, next) => {
    // get user login params
    const { email, password } = req.body;
    
    // find the login user
    User.findByCredentials(email, password).then(user => {
        if (!user) return Promise.reject({ message: 'User does not exist.' });
        // user found => create new session token
        return user.createSession().then(sessionToken => {
            // generate access auth token
            return user.generateAccessAuthToken().then(accessToken => {
                // send both tokens to client
                return { accessToken, sessionToken };
            });
        }).then(({ accessToken, sessionToken }) => {
            // respond with auth tokens and user data
            res.cookie('user-id', user._id, sessionTokenCookieOptions)
               .cookie('session-token', sessionToken, sessionTokenCookieOptions)
               .cookie('access-token', accessToken, accessTokenCookieOptions)
               .send(user);
        });
    }).catch(err => {
        next(createError(401, err.message));
    });
});

// log out user by manually expiring cookies
router.get('/users/logout', (req, res, next) => {
    // get cookies
    const cookies = req.cookies;
    // remove each cookie
    for (let key in cookies) {
        // safely access keys
        if (!(key in cookies)) continue;
        // reset value and expire each cookie
        res.cookie(key, '', { expires: new Date(0) });
    }
    // send successful response
    res.status(200).send();
});

// generate an access token for the client
router.get('/users/me/access-token', verifySession, (req, res, next) => {
    
    // get user docoument from verifySession middleware
    const user = req.user;

    user.generateAccessAuthToken().then(accessToken => {
        // send access token only in cookie for security
        res.cookie('access-token', accessToken, accessTokenCookieOptions)
           .status(200).send(user);

    }).catch(err => {
        next(err);
    });
});



module.exports = router;
