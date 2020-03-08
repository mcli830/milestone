const { User } = require("../models/index");
const router = require('express').Router();

// register user
router.post('/users', (req, res) => {
    // create user instance from params
    const user = new User(req.body);

    // save new user -- validations handled by mongoose
    user.save().then(() => {
        // successful save => create new session
        return user.createSession();
        // return promise resolving with new refreshToken
    }).then(refreshToken => {
        // session created => generate access token for client
        return user.generateAccessAuthToken().then(accessToken => {
            // send both tokens to client
            return { accessToken, refreshToken };
        });
    }).then(({ accessToken, refreshToken }) => {
        // respond with auth tokens and user data
        res.header('x-refresh-token', refreshToken)
           .header('x-access-token', accessToken)
           .send(user);

    }).catch(err => {
        res.status(400).send(err);
    });
});

// log in user
router.post('/users/login', (req, res) => {
    // get user login params
    const { email, password } = req.body;

    // find the login user
    User.findByCredentials(email, password).then(user => {
        // user found => create new session token
        return user.createSession().then(refreshToken => {
            // generate access auth token
            return user.generateAccessAuthToken().then(accessToken => {
                // send both tokens to client
                return { accessToken, refreshToken };
            });
        }).then(({ accessToken, refreshToken }) => {
            // respond with auth tokens and user data
            res.header('x-refresh-token', refreshToken)
               .header('x-access-token', accessToken)
               .json(user);
        });
    }).catch(err => {
        res.send(err);
    }); 

});

router.get('/', (req, res) => {
    res.send('Hello auth router!');
})

module.exports = router;