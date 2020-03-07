const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    password: String,
    salt: String,
});

schema.methods.verifyPassword = function(password, callback) {
    return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('User', schema);