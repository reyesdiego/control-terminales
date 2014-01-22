/**
 * Created by Administrator on 1/10/14.
 */
module.exports = function (app){

	var PriceList = require('../models/priceList.js');

	getPriceList = function (req, res){

		PriceList.find(function(err, priceList){
			if(!err) {
				res.send(priceList);
			} else {
				console.log('ERROR: ' + err);
			}
		})
	};

	addPrice = function (req, res){

		var price = new PriceList({
			description: req.body.description,
			unit: req.body.topPrice,
			currency: req.body.currency,
			topPrice: req.body.topPrice
		});
		price.save(function (err){
			if(!err) {
				console.log('Created');
				res.send(price);
			} else {
				console.log('ERROR: ' + err);
			}
		});
	};

	app.get('/agp/pricelist', getPriceList);
	app.post('/agp/addprice', addPrice);
}
