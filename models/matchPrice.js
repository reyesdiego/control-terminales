/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose');

var matchPrice = new mongoose.Schema({
	_id:	{type: String},
	codes:	[
		{
			terminal:	{ type: String, required: true},
			codes:		[String]
		}
	]
});

module.exports = mongoose.model('matchprices', matchPrice);