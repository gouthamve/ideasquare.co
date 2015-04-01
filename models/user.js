var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	id: String,
	name: String,
	token: String,
	posts: [String]
});

module.exports = mongoose.model('User', userSchema);