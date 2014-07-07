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
				res.send(403, {status:"ERROR", data: err.error});
			} else {
				var ter = (usr.role === 'agp')?req.params.terminal:usr.terminal;
				var param = {
					$or : [
						{terminal:	"AGP"},
						{terminal:	ter}
					]
				};

				if (req.query.code){
					param.code = req.query.code;
				}

				price.find(param)
					.sort({terminal:1, code:1})
					.exec(function(err, priceList){
					if(!err) {
						res.send(200, {status:'OK', data:priceList});
					} else {
						console.error('%s - Error: %s', dateTime.getDatetime(), err);
						res.send(500, {status:'ERROR', data: err});
					}
				});
			}
		});
	}

	function getRates (req, res){
		'use strict';
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error('%s - Error: %s', dateTime.getDatetime(), err);
				res.send(403, {status:"ERROR", data: err.error});
			} else {
				var param = {
						terminal:	"AGP",
						rate:		{$ne: null}
				};

				price.find(param)
					.sort({rate:1, code:1})
					.exec(function(err, priceList){
						if(!err) {
							res.send(200, {status:'OK', data:priceList});
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
				res.send(403, {status:'ERROR', data: err});
			} else {
				var _price;
				try {
					_price = new price({
						terminal:	req.body.terminal,
						code:		req.body.code.toUpperCase(),
						description:req.body.description,
						unit:		req.body.unit,
						currency:	req.body.currency,
						topPrice:	req.body.topPrice,
						matches:	null
					});
				} catch (error){
					res.send(500, {"status":"ERROR", "data": error.message});
					return;
				}
				_price.save(function (errSave, data){
					if(!err) {
						console.log("%s - Price INS:%s - %s", dateTime.getDatetime(), data._id, usr.terminal);
						res.send(200,{"status": "OK", "data": _price});
					} else {
						console.error('%s - Error: %s', dateTime.getDatetime(), errSave);
						res.send(500, {"status":"ERROR", "data": errSave});
					}
				});
			}
		});
	}

	app.get('/prices/:terminal', getPrices);
	app.get('/rates', getRates);
	app.post('/price', addPrice);

};