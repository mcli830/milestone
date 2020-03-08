const { User } = require("../models/index");
const router = require('express').Router();

router.post('/register', (req, res, next) => {

});

router.get('/', (req, res) => {
    res.send('Hello auth router!');
})

module.exports = router;