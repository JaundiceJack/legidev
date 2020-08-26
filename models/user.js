// Set up and export a database model to store user information
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}
})

const User = module.exports = mongoose.model('User', userSchema);
