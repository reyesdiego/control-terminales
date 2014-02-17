/**
 * Created by Administrator on 1/10/14.
 */
'use strict';

module.exports = function (app){

	var PriceList = require('../models/priceList.js');

	function getPriceList (req, res){
		'use strict';

		PriceList.find(function(err, priceList){
			if(!err) {
				res.send(priceList);
			} else {
				console.log('ERROR: ' + err);
			}
		})
	}

	function addPrice (req, res){
		'use strict';

		var price = new PriceList({
			code:		req.body.code.toUpperCase(),
			description:req.body.description,
			unit:		req.body.unit,
			currency:	req.body.currency,
			topPrice:	req.body.topPrice
		});
		price.save(function (err){
			if(!err) {
				console.log('Created');
				res.send(price);
			} else {
				console.log('ERROR: ' + err);
			}
		});
	}

	app.get('/agp/prices', getPriceList);
	app.get('/agp/price/{:id}', getPriceList);
	app.post('/agp/price', addPrice);

};
