/**
 * Created by Diego Reyes on 1/10/14.
 */
var mongoose = require('mongoose');

var price = new mongoose.Schema({
	_id:			{type: String},
	terminal:		{type: String},
	code:			{type: String},
	description:	{type: String},
	unit:			{type: String},
	currency:		{type: String},
	topPrice:		{type: Number},
	match:			[
						{
							terminal: {type: String},
							codes: [{type:String}]
						}
					]
});

price.virtual('unitCurrency').get(function(){
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
price.set('toJSON', {virtuals: true,
	transform: function(doc, ret, options) {
		delete ret._id;
		delete ret.unit;
		delete ret.currency;
		delete ret.__v;
		return ret;
	}
});

module.exports = mongoose.model('prices', price);