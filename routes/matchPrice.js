/**
 * Created by Diego Reyes	on 2/18/14.
 */

module.exports = function (app, log){
	'use strict';

	var MatchPrice = require('../models/matchPrice.js');
	var Invoice = require('../models/invoice.js');
	var util = require('util');
	var Price = require('../models/price.js');
	var moment = require('moment');

	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));

	function getMatchPrices (req, res){

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {
				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('Error: %s', 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					var ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;
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

					Price.find(param, {topPrices : {$slice:-1}})
						.populate({path:'matches', match:{"terminal":req.params.terminal}})
						.sort({terminal:1,code:1})
						.exec(function (err, prices) {
							if(!err) {
								res.send(200, {status:'OK', data:prices});
							} else {
								log.logger.error('Error: %s', err.message);
								res.send(500, {status:'ERROR', data: err.message});
							}
						});
				}

			}
		});
	}

	function getMatchPricesPrice (req, res){

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {
				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('Error: %s', 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					var ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;
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

					Price.aggregate([
							{$match: param},
							{$unwind: '$matches'},
							{$project: {topPrices:true, matches: true}}
							])
						.exec(function (err, prices) {
							if(!err) {
								MatchPrice.find({}, {code:true, price: true}, function (err, matches){
									var Enumerable = require('linq');
									var response = [];
									Enumerable.from(matches)
										.join(Enumerable.from(prices), '$.price.id', '$._id.id', function (match, price){
											response.push({code: match.code,
															topPrices : price.topPrices})
										}
									).toArray();
									res.send(200, {status:'OK', data: response});
								});
							} else {
								log.logger.error('Error: %s', err.message);
								res.send(500, {status:'ERROR', data: err.message});
							}
						});
				}

			}
		});
	}

	function getMatches (req, res){

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {
				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal){
					var errMsg = util.format('Error: %s', 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					var param = [
						{
							$match: {terminal:	paramTerminal }
						},
						{	$unwind: '$match' }
					];

					var s = MatchPrice.aggregate(param);
					s.exec(function (err, matches) {
						if(!err) {

							Price.find({$or: [{terminal:"AGP"}, {terminal: paramTerminal }]})
								.exec(function (err, prices) {
									if(!err) {
										var result = {};
										var Enumerable = require('linq');
										var response = Enumerable.from(matches)
											.join(Enumerable.from(prices), '$.price.id', '$._id.id', function (match, price){
												if (req.query.type){
													match.description = {
														'currency': price.currency,
														'price': price.topPrice
													};
												} else {
													match.description = price.description;
												}
												return match;
											}).toArray();
										response.forEach(function (item){
											result[item.match] = item.description;
										});

										res.send(200, {status:'OK', data: result});

									} else {
										log.logger.error('Error: %s', err.message);
										res.send(500, {status:'ERROR', data: err.message});
									}
								});

						} else {
							var errMsg = util.format('Error: %s', err.message);
							log.logger.error(errMsg);
							res.send(500, {status:'ERROR', data: errMsg});
						}
					});
				}
			}
		});
	}

	function getNoMatches (req, res) {

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {
				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal){
					var errMsg = util.format('Error: %s', 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {

					var param = [
						{
							$match: {terminal:	paramTerminal }
						},
						{	$unwind: '$match' },
						{ $project: {match: '$match', _id:0}}
					];

					var s = MatchPrice.aggregate(param);
					s.exec(function (err, noMatches){
						if(!err) {
							var arrNoMatches = [];
							noMatches.forEach(function (item){
								arrNoMatches.push(item.match);
							});
							var fecha;
							var param = {};
							if (req.query.fechaInicio || req.query.fechaFin){
								param["fecha.emision"]={};
								if (req.query.fechaInicio){
									fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z')).toDate();
									param["fecha.emision"]['$gte'] = fecha;
								}
								if (req.query.fechaFin){
									fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z')).toDate();
									param["fecha.emision"]['$lte'] = fecha;
								}
							}
							param.terminal = paramTerminal;

							Invoice.aggregate([
								{ $match: param},
								{ $unwind: '$detalle'},
								{ $unwind: '$detalle.items'},
								{ $match: {'detalle.items.id' : {$nin: arrNoMatches } } },
								{ $group: {_id: {
													code : '$detalle.items.id'
												}
										}
								},
								{$sort:{'_id.code':1}}
							], function (err, data){
								var result = [];
								data.forEach(function (item){
									result.push(item._id.code);
								});

								res.send(200, {
									status:'OK',
									totalCount: result.length,
									data: result});
							});
						}
					});

				}
			}
		});
	}

	function addMatchPrice (req, res){

		var async = require('async');

		var matches = req.body;

		async.forEachSeries( matches, function(match, asyncCallback){

			Price.findOne({_id: match._idPrice}, function(err, priceItem){
				if(!err && priceItem) {
					if (match._id !== undefined && match._id != null){
						MatchPrice.findOne({_id: match._id}, function(err, matchItem){
							matchItem.match = match.match;
							matchItem.save(function (err) {
								asyncCallback();
							});
						});
					} else {
						var _matchPrice2Add = {
							terminal: match.terminal,
							code: match.code,
							match: match.match,
							price: match._idPrice
						};
						_matchPrice2Add = new MatchPrice(_matchPrice2Add);
						_matchPrice2Add.save(function (err, data){
							if (priceItem.matches == null){
								priceItem.matches = [];
							}
							priceItem.matches.push(data._id);
							priceItem.save();
							asyncCallback();
						});
					}

				}
			});

		}, function (err){
			res.send({status:"OK", data: {matches: matches.length}});
		});

	}

	app.get('/matchprices/:terminal', getMatchPrices);
	app.get('/matchprices/price/:terminal', getMatchPricesPrice);
	app.get('/matches/:terminal', getMatches);
	app.get('/noMatches/:terminal', getNoMatches);
	app.post('/matchprice', addMatchPrice);
	app.put('/matchprice', addMatchPrice);

};
