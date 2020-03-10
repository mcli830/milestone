const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const router = require('express').Router();
const { User } = require('../models/index');

/* MIDDLEWARE */

// validate request access token
const authenticate = (req, res, next) => {

  // get access token from auth header
  const token = "authorization" in req.headers ? req.headers.authorization.replace('Bearer ', '') : null;

  // verify token
  if (token) {
    return jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send(err);
      }

      // jwt is valid -- attach user_id to request
      req.user_id = decoded._id;
      next();
    });
  }
  // no header or token
  res.status(401).send(createError(401));
}

router.get('/me', authenticate, (req, res) => {
  // find user by id in database
  User.findById({ _id: req.user_id }, (err, user) => {
    if (err) res.status(401).send(err);
    // no user
    if (!user) res.status(401).send({ message: 'No user' });
    // send user data
     res.send(user);
  });
});

router.get('/', (req, res) => {
  res.send('Hello API router!');
});

module.exports = router;
