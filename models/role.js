/**
 * Created by diego on 4/22/14.
 */

var mongoose = require('mongoose');

var role = new mongoose.Schema({
	name:	{type: String},
	level:	{type: Number},
	tasks:  [String]
});


//role.post('init', function (doc) {
//	console.log('%s has been initialized from the db', doc._id);
//});

role.pre('save', function (next, done){
	if (this.level){
		if (this.level === 2) {
			return next(new Error('Level can`t be 2'));
		}
	}
	console.log('save pre ', this);
	next();
});

module.exports = mongoose.model('roles', role);
