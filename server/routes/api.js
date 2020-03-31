const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const router = require('express').Router();
const { User } = require('../models/index');

/* MIDDLEWARE */

// validate request access token
const authenticate = (req, res, next) => {

  // get access token from auth header
  // const token = "authorization" in req.headers ? req.headers.authorization.replace('Bearer ', '') : null;

  // get access token from cookies
  const accessToken = req.cookies['access-token'];

  // verify token
  if (accessToken) {
    return jwt.verify(accessToken, process.env.SECRET, (err, decoded) => {
      if (err) {
        return next(err);
      }

      // jwt is valid -- attach user_id to request
      req.user_id = decoded._id;
      next();
    });
  }
  // no access token
  next(createError(401));
}

router.get('/me', authenticate, (req, res, next) => {
  // find user by id in database
  User.findById({ _id: req.user_id }, (err, user) => {
    if (err) return next(err);
    // no user
    if (!user) return next(createError(401, 'No user'));
    // send user data
     res.send(user);
  });
});

router.get('/', (req, res) => {
  res.send('Hello API router!');
});

module.exports = router;
