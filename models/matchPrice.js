/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose');

var matchPrice = new mongoose.Schema({
	terminal:	{type: String},
	code:		{type: String},
	match:		[{type: String}]//,
//	price:		{type: mongoose.Schema.ObjectId, ref:'prices'}
});

module.exports = mongoose.model('matchprices', matchPrice);