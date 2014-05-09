/**
 * Created by Administrator on 1/10/14.
 */
'use strict';

var path = require('path');
var Account = require(path.join(__dirname, '..', '/models/account'));

var dateTime = require('../include/moment');

module.exports = function (app){

	var price = require('../models/price.js');

	function getPrices (req, res){
		'use strict';
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error('%s - Error: %s', dateTime.getDatetime(), err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {
				var param = {
					$or : [
						{terminal:	"AGP"},
						{terminal:	usr.terminal}
					]
				};

				if (req.query.code){
					param._id = req.query.code;
				}

				price.find(param)
					.sort({terminal:1, _id:1})
					.exec(function(err, priceList){
					if(!err) {
						res.send(200, {status:200, data:priceList});
					} else {
						console.error('%s - Error: %s', dateTime.getDatetime(), err);
						res.send(500, {status:'ERROR', data: err});
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