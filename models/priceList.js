/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose');

var priceList = new mongoose.Schema({
	code:			{type: String},
	description:	{type: String},
	unit:			{type: String},
	currency:		{type: String},
	topPrice:		{type: Number}
});

priceList.virtual('unitCurrency').get(function(){
	var cur, unit;
	if (this.unit === 'TN')
		unit = 'tn';
	else if (this.unit === 'CONTAINER')
		unit = 'Container';
	else
		unit = 'Cajón';

	if (this.currency === 'DOL')
		cur = 'U$S';
	else
		cur = '$';

	return cur + '/' + unit;
});
priceList.set('toJSON', {virtuals: true,
	transform: function(doc, ret, options) {
		delete ret._id;
		delete ret.unit;
		delete ret.currency;
		delete ret.__v;
		return ret;
	}
});

module.exports = mongoose.model('PriceList', priceList);