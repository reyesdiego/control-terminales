/**
 * Created by diego on 8/26/14.
 */

var mongoose = require('mongoose');

var Log = new mongoose.Schema({
	file:		{type: String},
	datetime:	{type: Date, required: true},
	user:		{type: String},
	message:	{type: String, required: true},
	type:		{type: String, enum:['INFO', 'WARN', 'ERROR']},
	data:		{type: Object}
});

module.exports = mongoose.model('logs', Log);
