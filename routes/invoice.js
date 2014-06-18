/**
 * Created by Diego Reyes on 2/17/14.
 */

'use strict';

var path = require('path');
var Account = require(path.join(__dirname, '..', '/models/account'));

var dateTime = require('../include/moment');
var moment = require('moment');

/**
 * Created by Diego Reyes on 1/7/14.
 *
 * @module Routes
 */
module.exports = function(app, io) {

	var Invoice = require('../models/invoice.js');
	var Price = require('../models/price.js');

	//GET - Return all invoice in the DB
	function getInvoices (req, res) {

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {
				var fecha;
				var param = {};

				if (req.query.fechaInicio || req.query.fechaFin){
					param["fecha.emision"]={};
					if (req.query.fechaInicio){
						fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
						param["fecha.emision"]['$gte'] = fecha;
					}
					if (req.query.fechaFin){
						fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
						param["fecha.emision"]['$lt'] = fecha;
					}
				}
				if (req.query.nroComprobante){
					param.nroComprob = req.query.nroComprobante;
				}
				if (req.query.razonSocial){
					param.razon = {$regex:req.query.razonSocial}
				}
				if (req.query.documentoCliente){
					param.nroDoc = req.query.documentoCliente;
				}

				if (req.query.contenedor)
					param['detalle.contenedor'] = req.query.contenedor;


				param.terminal= usr.terminal;

				var invoices = Invoice.find(param);

				invoices.limit(req.params.limit).skip(req.params.skip);
				invoices.sort({nroComprob:1});
				invoices.exec(function(err, invoices) {
					if(!err) {
						Invoice.count(param, function (err, cnt){
							var result = {
								status: 'OK',
								totalCount: cnt,
								pageCount: (req.params.limit > cnt)?cnt:req.params.limit,
								page: req.params.skip,
								data: invoices
							}
							res.send(200, result);
						});
					} else {
						console.error("%s - Error: %s", dateTime.getDatetime(), err.error);
						res.send(500 , {status: "ERROR", data: err});
					}
				});
			}
		});
	}

	function getInvoice(req, res){
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.log(usr);
				res.send({status:'ERROR', data: err});
			} else {
				var invoice = Invoice.find({_id: req.params.id, terminal: usr.terminal});
				invoice.exec(function(err, invoices){
					if (err) {
						console.error("%s - Error: %s", dateTime.getDatetime(), err.error);
						res.send({status:'ERROR', data: err});
					} else {
						res.send(200, {status:"OK", data: invoices[0]})
					}
				})
			}
		});
	}

	function addInvoice ( req, res) {
		var postData = '';
		req.setEncoding("utf8");

		req.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
		});
		req.addListener("end", function() {

			var incomingToken = req.headers.token;
			Account.verifyToken(incomingToken, function(err, usr) {
				try {
					postData = JSON.parse(postData);
				} catch (errParsing){
					console.error("%s - Error: Parsing JSON: %s, JSON:%s", dateTime.getDatetime(), errParsing, postData);
					res.send(500, {status:"ERROR", data: errParsing.toString()} );
					return;
				}

				if (err) {
					console.error("%s - Error: %s", dateTime.getDatetime(), err.error);
					res.send(403, {status: "ERROR", data: err.error});
				} else {
					try {
						var invoice = {
						terminal:		usr.terminal,

						nroPtoVenta:	postData.nroPtoVenta,
						codTipoComprob: parseInt(postData.codTipoComprob.toString().trim(), 10),
						nroComprob:		postData.nroComprob,
						codTipoAutoriz:	postData.codTipoAutoriz,
						codAutoriz:		postData.codAutoriz,
						codTipoDoc:		postData.codTipoDoc,
						nroDoc:			postData.nroDoc,
						clienteId:		postData.clientId,
						razon:			postData.razon,
						importe:		{
											gravado:		postData.impGrav,
											noGravado:		postData.impNoGrav,
											exento:			postData.impExento,
											subtotal:		postData.impSubtot,
											iva:			postData.impIva,
											otrosTributos:	postData.impOtrosTrib,
											total:			postData.impTotal
										},
						codMoneda:		postData.codMoneda,
						cotiMoneda:		postData.cotiMoneda,
						observa:	 	postData.observa,
						codConcepto:	postData.codConcepto,
						fecha:			{
											emision:	moment(postData.fechaEmision),
											vcto:		moment(postData.fechaVcto),
											desde:		moment(postData.fechaServDesde),
											hasta:		moment(postData.fechaServHasta),
											vctoPago:	moment(postData.fechaVctoPago)
										},
						detalle:		[],
						otrosTributos:	[]
						};

						postData.detalle.forEach(function (container){
						var buque = {
							codigo: container.buqueId,
							nombre: container.buqueDesc,
							viaje: container.viaje
						};
						var cont = {
							contenedor:		container.contenedor,
							IMO:			container.IMO,
							buque:			buque,
							items: []
						};
						if (container.items){
							container.items.forEach( function (item){
								cont.items.push(
									{
										id:			item.id,
										cnt:		item.cnt,
										uniMed:		item.uniMed,
										impUnit:	item.impUnit,
										impIva:		item.impIva,
										impTot:		item.impTot
									});
							});
						} else {
							res.send(500, {"status":"ERROR", "data": "El contenedor no posee items."});
							return;
						}
						invoice.detalle.push(cont);
					});

					} catch (error){
						res.send(500, {"status":"ERROR", "data": error.message});
						return;
					}

					var invoice2add = new Invoice(invoice);
					invoice2add.save(function (errSave, data, rowsAffected) {
						if (!errSave) {
							console.log("%s - Invoice INS:%s - %s - Tipo: %s - %s", dateTime.getDatetime(), data._id, usr.terminal, postData.codTipoComprob, postData.fechaEmision);
							var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
							io.sockets.emit('invoice', socketMsg);
							res.send(200,{"status": "OK", "data": data});
						} else {
							var date = new Date();
							console.error('%s - Error: %s', dateTime.getDatetime(), errSave);
							res.send(500, {"status": "ERROR", "data": errSave});
						}
					});

//					for () {
//						invoice.otrosTributos.push(
//						{
//							id:			,
//							desc	:	,
//							imponible:	,
//							imp:
//						})
//					}
				}
			});
		});
	}

	function removeInvoices ( req, res){
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (!err){
				console.log(usr);
				Invoice.remove({_id: req.params._id}, function (err){
					if (!err){
						console.log('Eliminado');
						res.send({"response": "OK"});
					} else {
						res.send({"error": "Error al intentar eliminar"});
					}
				});
			}
			else {
				res.send(err);
			}
		});
	}

	function getCounts (req, res){
		var mongoose = require('mongoose');

		var jsonParam = [];

		if (req.query.fecha){
			var objIdToday = dateTime.getObjectId0000(req.query.fecha);
			var objIdTomorrow = dateTime.getObjectId0000(moment(req.query.fecha).add('days',1));

			jsonParam.push({$match: {_id: {
				$gte: mongoose.Types.ObjectId(objIdToday),
				$lt: mongoose.Types.ObjectId(objIdTomorrow)
			}
			}});
		}
		jsonParam.push({ $group: {
			_id: {terminal:'$terminal'},
			cnt: {$sum: 1}
		}});

		Invoice.aggregate(jsonParam, function (err, data){
			if (!err){
				res.send({status:"OK", data: data}, {"content-type":"applicacion/json"}, 200);
			} else {
				console.error(err);
				res.send(err, {"content-type":"text/plain"}, 500);
			}
		});
	}

	function getCountByDate (req, res) {
		var moment = require('moment');

		var date = moment(moment().format('YYYY-MM-DD'));
		if (req.query.fecha !== undefined){
			date = moment(moment(req.query.fecha).format('YYYY-MM-DD'));
		}
		var date5Ago = moment(date).subtract('days', 4).toDate();
		var tomorrow = moment(date).add('days', 1).toDate();

		var jsonParam = [
			{$match: { 'fecha.emision': {$gte: date5Ago, $lt: tomorrow} }},
			{ $project: {'accessDate':'$fecha.emision', terminal: '$terminal'} },
			{ $group : {
				_id : { terminal: '$terminal',
					year: { $year : "$accessDate" },
					month: { $month : "$accessDate" },
					day: { $dayOfMonth : "$accessDate" },
					date: '$accessDate'
				},
				cnt : { $sum : 1 }
			}
			},
			{ $sort: {'_id.date': 1, '_id.terminal': 1 }}
		];

		Invoice.aggregate(jsonParam, function (err, data){
			res.send(200, data);
		});

	}

	function getCountByMonth (req, res) {
		var date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date()-1);
		if (req.query.fecha !== undefined){
			date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date()-1);
		}
		var month5Ago = moment(date).subtract('months',4).toDate();
		var nextMonth = moment(date).add('months',1).toDate();

		var jsonParam = [
			{$match: { 'fecha.emision': {$gte: month5Ago, $lt: nextMonth} }},
			{ $project: {'accessDate':'$fecha.emision', terminal: '$terminal'} },
			{ $group : {
							_id : { terminal: '$terminal',
								year: { $year : "$accessDate" },
								month: { $month : "$accessDate" }
							},
							cnt : { $sum : 1 }
						}
			},
			{ $sort: {'_id.month': 1, '_id.terminal': 1 }}
		];

		Invoice.aggregate(jsonParam, function (err, data){
			if (err){
				res.send(500, err);
			} else {
				res.send(200, data);
			}
		});

	}

	function getNoRates (req, res){
		var terminal = req.params.terminal;

		var _price = require('../include/price.js');
		var _rates = new _price.price();
		_rates.rates(function (err, rates){
			if (rates.length>0){
				var param = {
					terminal : terminal,
					'detalle.items.id': {$nin: rates}
				}
				var invoices = Invoice.find(param);
				invoices.limit(req.params.limit).skip(req.params.skip);
				invoices.sort({nroComprob:1});
				invoices.exec(function(err, invoices){
					Invoice.count(param, function (err, cnt){
						var dataResult = {
							status: 'OK',
							totalCount: cnt,
							pageCount: (req.params.limit > cnt)?cnt:req.params.limit,
							page: req.params.skip,
							data: invoices
						}
						res.send(200, dataResult);
					});
				});
			} else {
				var errorResult = {
					status: 'ERROR',
					data: 'La terminal no tiene Tasa a las Cargas Asociadas.'
				}
				res.send(500, errorResult);
			}
		});

	}

	function getRatesTotal (req, res) {

		var moment = require('moment');

		var today = moment(moment().format('YYYY-MM-DD')).toDate();
		var tomorrow = moment(moment().format('YYYY-MM-DD')).add('days',1).toDate();
		if (req.query.fecha !== undefined){
			today = moment(moment(req.query.fecha).format('YYYY-MM-DD')).toDate();
			tomorrow = moment(moment(req.query.fecha).format('YYYY-MM-DD')).add('days',1).toDate();
		}

		var _price = require('../include/price.js');
		var _rates = new _price.price();
		_rates.rates(function (err, rates){
			var jsonParam = [
				{	$unwind : '$detalle'	},
				{	$unwind : '$detalle.items'	},
				{	$match : {
					'detalle.items.id' : {$in: rates},
					'fecha.emision': {$gte: today, $lt: tomorrow} }
				},
				{
					$project : {_id: 0, terminal:1, 'detalle.items':1}
				},
				{
					$group  : {
						_id: { terminal: '$terminal'},
						cnt: { $sum: 1},
						total: { $sum : '$detalle.items.impTot'}
					}
				}
			];
			Invoice.aggregate(jsonParam, function (err, data){
				res.send(200, data);
			});
		});

	}

	app.get('/invoices/:skip/:limit', getInvoices);
	app.get('/invoice/:id', getInvoice);
	app.get('/invoices', getInvoices);
	app.get('/invoices/counts', getCounts);
	app.get('/invoices/countsByDate', getCountByDate);
	app.get('/invoices/countsByMonth', getCountByMonth);
	app.get('/invoices/noRates/:terminal/:skip/:limit', getNoRates);
	app.get('/invoices/ratesTotal', getRatesTotal);
	app.post('/invoice', addInvoice);
	app.delete('/invoices/:_id', removeInvoices);

	app.get('/precio', function (req, res){
		var p = require('../include/price.js');
		var p = new p.price();
		p.rates(function (err, data){
			res.send(data);
		});
	})

};