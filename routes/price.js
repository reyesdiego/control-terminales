/**
 * Created by Administrator on 1/10/14.
 */
'use strict';

module.exports = function (app){

	var price = require('../models/price.js');

	function getPrices (req, res){
		'use strict';

		price.find().exec(function(err, priceList){
			if(!err) {
				res.send(priceList);
			} else {
				console.log('ERROR: ' + err);
			}
		})
	}

	function addPrice (req, res){
		'use strict';
console.log(req.body);
		var _price = new price({
			_id:		req.body._id.toUpperCase(),
			terminal:	req.body.terminal,
//			code:		req.body.code.toUpperCase(),
			description:req.body.description,
			unit:		req.body.unit,
			currency:	req.body.currency,
			topPrice:	req.body.topPrice,
			match:		null
		});
		_price.save(function (err){
			if(!err) {
				console.log('Created');
				res.send(_price);
			} else {
				console.log('ERROR: ' + err);
			}
		});
	}

	app.get('/agp/prices', getPrices);
	app.post('/agp/price', addPrice);

};