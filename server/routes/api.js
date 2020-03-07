const passport = require('passport');
const registerUser = require('../auth/register');
const router = require('express').Router();

// routes
router.post(
  '/register',
  registerUser,
  passport.authenticate('local'),
  // json response with user data
  (req, res, next) => {
    res.json({ user: req.user });
  }
);

router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ user: req.user });
});

router.get('/', (req, res) => {
  res.send('Hello API router!');
});

module.exports = router;
