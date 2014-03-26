/**
 * Created by Administrator on 1/10/14.
 */
'use strict';

var path = require('path');
var Account = require(path.join(__dirname, '..', '/models/account'));

module.exports = function (app){

	var price = require('../models/price.js');

	function getPrices (req, res){
		'use strict';
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.log(err, new Date().toString());
				res.send(401, "Invalid or missing Token.");
			} else {
				price.find({$or:[{terminal:usr.terminal}, {terminal: "AGP"}]} ).exec(function(err, priceList){
					if(!err) {
						res.send(priceList);
					} else {
						console.log('ERROR: ' + err);
					}
				});
			}
		});
	}

	function addPrice (req, res){
		'use strict';
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.log(err, new Date().toString());
				res.send(401, "Invalid or missing Token.");
			} else {
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
		});
	}

	app.get('/agp/prices', getPrices);
	app.post('/agp/price', addPrice);

};