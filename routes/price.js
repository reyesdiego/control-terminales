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
					var errMsg = util.format('Error: %s', 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					var ter = (usr.role === 'agp') ? req.params.terminal : usr.terminal;
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
							log.logger.error('Error: %s', err.message);
							res.send(500, {status:'ERROR', data: err.message});
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
					var errMsg = util.format('Error: %s', 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					var ter = (usr.role === 'agp') ? req.params.terminal : usr.terminal;
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
								log.logger.error('Error: %s', err.message);
								res.send(500, {status:'ERROR', data: err.message});
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
							log.logger.error('Error: %s', err.message);
							res.send(500, {status:'ERROR', data: err.message});
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
					req.body.topPrices.forEach(function (item){
						item.from = moment(item.from).format("YYYY-MM-DD 00:00:00 Z");
					});

					if (req.method === 'POST') {
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

						_price = price.findOne({_id: req.params.id}, function (err, price2Upd) {
							price2Upd.description = req.body.description;
							price2Upd.code = req.body.code;
							price2Upd.topPrices = req.body.topPrices;
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
					res.send(500, {"status":"ERROR", "data": "Error en addPrice " + error.message});
					return;
				}
			}
		});
	}

	function deletePrice( req, res) {

		var matchPrice = require('../models/matchPrice.js');

		var incomingToken = req.headers.token;

		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(err);
				res.send(403, {status:'ERROR', data: err});
			} else {
				price.remove({_id : req.params.id}, function (err){
					if (!err) {
						matchPrice.remove ({price: req.params.id}, function (err){
							if (!err){
								res.send(200, {status:'OK', data:{}})
							} else {
								log.logger.error('Error DELETE: %s - %s', err.message, usr.terminal);
								res.send(403, {status:'ERROR', data: err.message});
							}
						})
					} else {
						log.logger.error('Error DELETE: %s - %s', err.message, usr.terminal);
						res.send(403, {status:'ERROR', data: err.message});
					}
				})
			}
		});
	}

	app.get('/prices/:terminal', getPrices);
	app.get('/price/:id/:terminal', getPrice);
	app.get('/rates', getRates);
	app.post('/price', addPrice);
	app.put('/price/:id', addPrice);
	app.delete('/price/:id', deletePrice);

};