/**
 * Created by Administrator on 1/10/14.
 */
'use strict';

var path = require('path');
var Account = require(path.join(__dirname, '..', '/models/account'));
var util = require('util');
var moment = require('moment');

var dateTime = require('../include/moment');

module.exports = function (app, log){

	var price = require('../models/price.js');

	function getPrices (req, res){

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
				res.send(403, {status:"ERROR", data: err.error});
			} else {

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal){
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
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

					if (req.query.onlyRates){
						if (req.query.onlyRates !== false)
							param.rate = {$exists:true};
					}

					price.find(param, {topPrices : {$slice:-1}})
						.sort({terminal:1, code:1})
						.exec(function(err, priceList){
						if(!err) {
							res.send(200,	{
												status: 'OK',
												totalCount: priceList.length,
												data: priceList
											}
							);
						} else {
							log.logger.error('Error: %s', err);
							res.send(500, {status:'ERROR', data: err});
						}
					});
				}
			}
		});
	}

	function getPrice (req, res){

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
				res.send(403, {status:"ERROR", data: err.error});
			} else {

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal){
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					var ter = (usr.role === 'agp')?req.params.terminal:usr.terminal;
					var param = {
						$or : [
							{terminal:	"AGP"},
							{terminal:	ter}
						]
					};

					if (req.params.id) {
						param._id = req.params.id;
					}

					price.findOne(param)
						.exec(function(err, price){
							if(!err) {
								res.send(200, {status:'OK', totalCount: 1, data: price});
							} else {
								log.logger.error('Error: %s', err);
								res.send(500, {status:'ERROR', data: err});
							}
						});
				}
			}
		});
	}

	function getRates (req, res){

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
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
							log.logger.error('Error: %s', err);
							res.send(500, {status:'ERROR', data: err});
						}
					});
			}
		});
	}

	function addPrice (req, res){

		var incomingToken = req.headers.token;

		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(err);
				res.send(403, {status:'ERROR', data: err});
			} else {
				var _price;
				try {
					req.body.topPrices[0].from = moment(moment()).format('YYYY-MM-DD HH:mm Z');
					if (req.method === 'POST'){
						_price = new price({
							terminal:	req.body.terminal,
							code:		req.body.code.toUpperCase(),
							description:req.body.description,
							unit:		req.body.unit,
							topPrices:	req.body.topPrices,
							matches:	null
						});
						_price.save(function (errSave, data){
							if(!errSave) {
								log.logger.insert("Price INS:%s - %s", data._id, usr.terminal);
								res.send(200,{"status": "OK", "data": _price});
							} else {
								log.logger.error('Error: %s', errSave.message);
								res.send(500, {"status":"ERROR", "data": errSave.message});
							}
						});
					} else {

						_price = price.findOne({_id: req.params.id}, function (err, price2Upd){
							price2Upd.description = req.body.description;
							price2Upd.code = req.body.code;
							if (req.body.topPrices[0].price !== price2Upd.topPrices[price2Upd.topPrices.length-1].price)
								price2Upd.topPrices.push (req.body.topPrices[0]);

							price2Upd.unit = req.body.unit;
							price2Upd.save(function (errSave, dataSaved){
								if(!errSave) {
									log.logger.update("Price UPD:%s - %s", dataSaved._id, usr.terminal);
									res.send(200,{"status": "OK", "data": dataSaved});
								} else {
									log.logger.error('Error: %s - %s', errSave.message, usr.terminal);
									res.send(500, {"status":"ERROR", "data": errSave.message});
								}
							});
						});
					}
				} catch (error){
					res.send(500, {"status":"ERROR", "data": error.message});
					return;
				}
			}
		});
	}

	app.get('/prices/:terminal', getPrices);
	app.get('/price/:id/:terminal', getPrice);
	app.get('/rates', getRates);
	app.post('/price', addPrice);
	app.put('/price/:id', addPrice);

};