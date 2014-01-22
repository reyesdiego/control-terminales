/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose');

var priceList = new mongoose.Schema({
	description:	{type: String},
	unit:			{type: String},
	currency:		{type: String},
	topPrice:		{type: Number}
});

module.exports = mongoose.model('PriceList', priceList);