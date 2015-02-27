/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app, io, log) {

	var dateTime = require('../include/moment');
	var moment = require('moment');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var Invoice = require('../models/invoice.js');
	var Gate = require('../models/gate.js');
	var util = require('util');
	var mail = require("../include/emailjs");
	var config = require('../config/config.js');
	var linq = require('linq');

	function getGates(req, res){
		'use strict';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(403, {status:'ERROR', data: err});
			} else {
				var fecha;
				var param = {};

				var limit = parseInt(req.params.limit, 10);
				var skip = parseInt(req.params.skip, 10);

				if (req.query.fechaInicio || req.query.fechaFin){
					param.gateTimestamp={};
					if (req.query.fechaInicio){
						fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
						param.gateTimestamp['$gte'] = fecha;
					}
					if (req.query.fechaFin){
						fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
						param.gateTimestamp['$lt'] = fecha;
					}
				}

				if (req.query.contenedor)
					param.contenedor = req.query.contenedor;
				if (req.query.buqueNombre)
					param.buque = req.query.buqueNombre;
				if (req.query.viaje)
					param.viaje = req.query.viaje;

				if (usr.role === 'agp')
					param.terminal= req.params.terminal;
				else
					param.terminal= usr.terminal;

				var gates = Gate.find(param).limit(limit).skip(skip);
				if (req.query.order){
					var order = JSON.parse(req.query.order);
					gates.sort(order[0]);
				} else {
					gates.sort({gateTimestamp:-1});
				}

				gates.exec( function( err, gates){
					if (err){
						log.logger.error("Error: %s", err.error);
						res.send(500 , {status: "ERROR", data: err});
					} else {
						Gate.count(param, function (err, cnt){
							var pageCount = gates.length;
							var result = {
								status: 'OK',
								totalCount: cnt,
								pageCount: (limit > pageCount) ? limit : pageCount,
								page: skip,
								data: gates
							};
							res.send(200, result);
						});
					}
				})
			}
		});

	}

	function getGatesByHour(req, res){
		'use strict';

		var date = moment(moment().format('YYYY-MM-DD')).toDate();
		if (req.query.fecha !== undefined){
			date = moment(moment(req.query.fecha).format('YYYY-MM-DD')).toDate();
		}
		var tomorrow = moment(date).add('days',1).toDate();

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(403, {status:'ERROR', data: err});
			} else {

				var jsonParam = [
					{$match: { 'gateTimestamp': {$gte: date, $lt: tomorrow} }},
					{ $project: {
						gateTimestamp : {$subtract:[ '$gateTimestamp', 60*60*3000]},
						terminal: '$terminal'}
					},
					{ $group : {
						_id : { terminal: '$terminal',
							year: { $year : "$gateTimestamp" },
							month: { $month : "$gateTimestamp" },
							day: { $dayOfMonth : "$gateTimestamp" },
							hour: { $hour : "$gateTimestamp" }
						},
						cnt : { $sum : 1 }
					}
					},
					{ $sort: {'_id.hour': 1, '_id.terminal': 1 }}
				];

				Gate.aggregate(jsonParam, function (err, data){
					res.send(200, data);
				});
			}
		});
	}

	function getGatesByMonth (req, res) {
		'use strict';

		var date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date()-1);
		if (req.query.fecha !== undefined){
			date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date()-1);
		}
		var month5Ago = moment(date).subtract('months', 4).toDate();
		var nextMonth = moment(date).add('months',1).toDate();

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(403, {status:'ERROR', data: err});
			} else {

				var jsonParam = [
					{$match: { 'gateTimestamp': {$gte: month5Ago, $lt: nextMonth} }},
					{ $project : {
						terminal: '$terminal',
						gateTimestamp : {$subtract:[ '$gateTimestamp', 60*60*3000]}
					}
					},
					{"$group":	{	_id:{
										"terminal":"$terminal",
										"year":{"$year":"$gateTimestamp"},
										"month":{"$month":"$gateTimestamp"}
									},
									cnt:{"$sum":1}
								}
					},
					{ $sort: {'_id.month': 1, '_id.terminal': 1 }}
				];
				Gate.aggregate(jsonParam, function (err, data){
					res.send(200, data);
				});
			}
		});
	}

	function getDistincts( req, res) {
		'use strict';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {

				var distinct = '';

				if (req.route.path === '/gates/:terminal/ships')
					distinct = 'buque';

				if (req.route.path === '/gates/:terminal/containers')
					distinct = 'contenedor';

				var param = {};
				if (usr.role === 'agp')
					param.terminal= req.params.terminal;
				else
					param.terminal= usr.terminal;

				Gate.distinct(distinct, param, function (err, data){
					if (err){
						res.send(500, {status: 'ERROR', data: err.message});
					} else {
						res.send(200,	{
											status: 'OK',
											totalCount: data.length,
											data: data.sort()
										}
						);
					}
				});
			}
		});

	}

	function getMissingGates (req, res) {
		'use strict';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {
				var terminal = '';
				if (usr.role === 'agp')
					terminal = req.params.terminal;
				else
					terminal = usr.terminal;

				var _price = require('../include/price.js');
					var _rates = new _price.price();
					_rates.rates(function (err, rates){

						var invoices = Invoice.aggregate([
							{$match: {terminal: terminal}},
							{$unwind: '$detalle'},
							{$unwind: '$detalle.items'},
							{$match: {'detalle.items.id': {$in: rates}}},
							{$project: {nroPtoVenta: 1, codTipoComprob: 1, nroComprob: 1, contenedor: '$detalle.contenedor', code: '$detalle.items.id', fecha: '$fecha.emision'}}
						]);

						if (req.query.order){
							var order = JSON.parse(req.query.order);
							invoices.sort(order[0]);
						} else {
							invoices.sort({codTipoComprob: 1, nroComprob: 1});
						}

						invoices.exec(function (err, dataInvoices){
						if (err)
							res.send(500, {status: 'ERROR', data: err.message});
						else {
							var gates = Gate.find({terminal: terminal, carga:"LL"}, {contenedor:1});
							gates.exec(function (err, dataGates){
								if (err)
									res.send(500, {status: 'ERROR', data: err.message});
								else {
									var invoicesWoGates = linq.from(dataInvoices)
										.except(dataGates, "$.contenedor").toArray();

									res.send(200, {	status:'OK',
											totalCount: invoicesWoGates.length,
											data: invoicesWoGates
										}
									);
								}
							});
						}
					});
				});

			}
		});

	}

	function getMissingInvoices (req, res) {
		'use strict';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {
				var terminal = '';
				if (usr.role === 'agp')
					terminal = req.params.terminal;
				else
					terminal = usr.terminal;

				var _price = require('../include/price.js');
				var _rates = new _price.price();
				_rates.rates(function (err, rates){

					var gates = Gate.find({terminal: terminal, carga:"LL"});
					if (req.query.order){
						var order = JSON.parse(req.query.order);
						gates.sort(order[0]);
					} else {
						gates.sort({gateTimestamp: 1});
					}
					gates.exec(function (err, dataGates){
						if (err)
							res.send(500, {status: 'ERROR', data: err.message});
						else {

							var invoices = Invoice.aggregate([
								{$match: {terminal: terminal}},
								{$unwind: '$detalle'},
								{$unwind: '$detalle.items'},
								{$match: {'detalle.items.id': {$in: rates}}},
								{$project: { contenedor: '$detalle.contenedor'}}
							]);

							invoices.exec(function (err, dataInvoices){

								if (err)
									res.send(500, {status: 'ERROR', data: err.message});
								else {
									var gatesWoGates = linq.from(dataGates)
										.except(dataInvoices, "$.contenedor").toArray();

									res.send(200, {	status:'OK',
											totalCount: gatesWoGates.length,
											data: gatesWoGates
										}
									);
								}


							});
						}
					});
				});

			}
		});

	}

	function addGate(req, res, next){
		'use strict';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err) {
				log.logger.error("Error Gate INS: %s", err.error);
				res.send(403, {status:"ERROR", data: err.error});
			} else {
				var gate2insert = req.body;

				gate2insert.gateTimestamp = moment(gate2insert.gateTimestamp);

				var inicio = gate2insert.turnoInicio;
				if (inicio !== undefined && inicio !== '' && inicio != null)
					gate2insert.turnoInicio = moment(inicio);
				else
					gate2insert.turnoInicio = null;

				var fin = gate2insert.turnoFin;
				if (fin !== undefined && fin !== '' && fin != null)
					gate2insert.turnoFin = moment(fin);
				else
					gate2insert.turnoFin = null;

				gate2insert.terminal = usr.terminal;
				gate2insert.buque = gate2insert.buque.trim();
				gate2insert.viaje = gate2insert.viaje.trim();
				gate2insert.contenedor = gate2insert.contenedor.trim();

				if (gate2insert) {
					Gate.insert(gate2insert, function (errSave, data) {
						if (!errSave){
							log.logger.insert('Gate INS: %s - %s - %s', data._id, usr.terminal, moment(gate2insert.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"));
							var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
							io.sockets.emit('gate', socketMsg);
							res.send(200, {status: "OK", data: data});
						} else {

							var errMsg = util.format('%s - ERROR: %s.-%s- \n%s', dateTime.getDatetime(), errSave.toString(), usr.terminal, JSON.stringify(req.body));
							log.logger.error(errMsg);

							var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
							var mailer = new mail.mail(config.email);
							mailer.send(usr.email, strSubject, errMsg, function(){
							});

							res.send(500, {status:"ERROR", data: errMsg});
						}
					});
				}
			}
		});
	}

	app.get('/gatesByHour', getGatesByHour);
	app.get('/gatesByMonth', getGatesByMonth);
	app.get('/gates/:terminal/:skip/:limit', getGates);
	app.get('/gates/:terminal/missingGates', getMissingGates);
	app.get('/gates/:terminal/missingInvoices', getMissingInvoices);
	app.get('/gates/:terminal/ships', getDistincts);
	app.get('/gates/:terminal/containers', getDistincts);
	app.post('/gate', addGate);

};