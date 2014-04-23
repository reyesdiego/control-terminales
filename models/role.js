/**
 * Created by diego on 4/22/14.
 */

var mongoose = require('mongoose');

var role = new mongoose.Schema({
	name:	{type: String},
	level:	{type: Number},
	tasks:  [String]
});

module.exports = mongoose.model('roles', role);
