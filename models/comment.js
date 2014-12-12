/**
 * Created by diego on 9/5/14.
 */

var mongoose = require('mongoose');

var schema = mongoose.Schema;

var commentSchema = new schema({
	title	: {type: String, required: true},
	comment	: {type: String},
	user	: {type: String, required: true},
	group	: {type: String, required: true},
	state	: {type: String, required: true, enum: ['R', 'Y', 'G', 'C', 'T']},
	invoice	: {type: mongoose.Schema.ObjectId, ref:'invoices'}
});

module.exports = mongoose.model('comment', commentSchema);