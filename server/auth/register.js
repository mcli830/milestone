const User = require('../models/user');

module.exports = (req, res, next) => {
  req.body.email = req.body.email.trim();
  
  // verify unique email for registration
  User.findOne({ email: req.body.email }, (err, user) => {
    // on mongo error
    if (err) return next(err);
    // on email already exists
    if (user) return res.json({ message: 'Email is already registered.'});
    // valid => create password hash
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
      // on bcrypt error
      if (err) return next(err);

      // create new user document
      User.create({
        name,
        email,
        password: hash,
      }, (err, doc) => {
        // on mongoose create error
        if (err) return next(err);
        // send user document to authentication middleware
        next(null, doc);
      });
    });
  });
}