const router = require('express').Router();

// routes
router.get('/', (req, res) => {
  res.send('Hello API router!');
});

module.exports = router;
