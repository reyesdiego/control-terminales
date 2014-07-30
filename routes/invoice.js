/**
 * Created by Diego Reyes on 2/17/14.
 */

'use strict';

var path = require('path');
var Account = require(path.join(__dirname, '..', '/models/account'));
var util = require('util');

var mail = require("../include/emailjs");

var dateTime = require('../include/moment');
var moment = require('moment');

var config = require('../config/config.js');

/**
 * Created by Diego Reyes on 1/7/14.
 *
 * @module Routes
 */
module.exports = function(app, io) {

	var Invoice = require('../models/invoice.js');
	var Price = require('../models/price.js');
	var MatchPrice = require('../models/matchPrice.js');

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
						param["fecha.emision"]['$lte'] = fecha;
					}
				}
				if (req.query.codTipoComprob){
					param.codTipoComprob = req.query.codTipoComprob;
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

				if (req.query.code)
					param['detalle.items.id'] = req.query.code;

				if (usr.role === 'agp')
					param.terminal = req.params.terminal;
				else
					param.terminal = usr.terminal;

				var invoices = Invoice.find(param);

				invoices.limit(req.params.limit).skip(req.params.skip);
				invoices.sort({codTipoComprob:1, nroComprob:1});
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
				res.send(403, {status:'ERROR', data: err});
			} else {
				var param = {
					_id: req.params.id
				};
				if (usr.role !== 'agp')
					param.terminal = usr.terminal;

				var invoice = Invoice.find(param);
				invoice.exec(function(err, invoices){
					if (err) {
						console.error("%s - Error: %s", dateTime.getDatetime(), err.error);
						res.send({status:'ERROR', data: err});
					} else {
						res.send(200, {status:"OK", data: invoices[0]||null})
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
					var strBody = util.format("%s - Error: Parsing JSON: [%s], JSON:%s", dateTime.getDatetime(), errParsing.toString(), postData);
					var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
					console.error(strBody);
					var mailer = new mail.mail(config.email);
					mailer.send(usr.email, strSubject, strBody);
					res.send(500, {status:"ERROR", data: strBody} );
					return;
				}

				if (err) {
					var errMsg = util.format("%s - Error: %s", dateTime.getDatetime(), err.error);
					console.error(errMsg);
					res.send(403, {status: "ERROR", data: errMsg});
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
										impTot:		item.impTot
									});
							});
						} else {
							var errMsg = util.format("%s - Error: %s", dateTime.getDatetime(), "El contenedor no posee items.");
							res.send(500, {status:"ERROR", data: errMsg});
							return;
						}
						invoice.detalle.push(cont);
					});

					} catch (error){
						var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
						var body = util.format('Error al insertar comprobante. %s. \n%s',  error.message, JSON.stringify(postData));

						var strError = util.format('%s - %s', dateTime.getDatetime(), body);
						console.error(strError);

						var mailer = new mail.mail(config.email);
						mailer.send(usr.email, strSubject, body, function(){
						});
						res.send(500, {"status":"ERROR", "data": body});
						return;
					}

					var invoice2add = new Invoice(invoice);
					invoice2add.save(function (errSave, data, rowsAffected) {
						if (!errSave) {
							console.log("%s - Invoice INS:%s - %s - Tipo: %s - %s", dateTime.getDatetime(), data._id, usr.terminal, postData.codTipoComprob, postData.fechaEmision);
							var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
							io.sockets.emit('invoice', socketMsg);
							res.send(200,{status: "OK", data: data});
						} else {
							//TODO crear objecto para tratar los errores, en este caso trato el tema de duplicados.
							if (errSave.code === 11000){
								Invoice.find({
									terminal:		usr.terminal,
									codTipoComprob:	invoice.codTipoComprob,
									nroComprob:		invoice.nroComprob,
									nroPtoVenta:	invoice.nroPtoVenta
								}, function (err, invoice){
									var errMsg = util.format('%s - Error INS: El tipo de comprobante: %s, número: %s, fue transferido el %s:\n %s\n\n%s - ERROR:%s\n\n%s', dateTime.getDatetime(), invoice[0].codTipoComprob, invoice[0].nroComprob, dateTime.getDateTimeFromObjectId(invoice[0]._id), invoice[0], moment(), errSave, JSON.stringify(postData));

									var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
									console.error(errMsg);
									var mailer = new mail.mail(config.email);
									mailer.send(usr.email, strSubject, errMsg, function(){
									});

									res.send(500, {status: "ERROR", data: errMsg});
								})
							} else {
								var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
								var strError = util.format('%s - Error INS: %s -\n%s', dateTime.getDatetime(), errSave, JSON.stringify(postData));
								console.error(strError);
								var mailer = new mail.mail(config.email);
								mailer.send(usr.email, strSubject, strError, function(){
								});

								res.send(500, {status: "ERROR", data: strError});
							}
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
			{ $project: {'accessDate':'$fecha.emision', terminal: '$terminal', total: '$importe.total'} },
			{ $group : {
				_id : { terminal: '$terminal',
					year: { $year : "$accessDate" },
					month: { $month : "$accessDate" },
					day: { $dayOfMonth : "$accessDate" },
					date: '$accessDate'
				},
				cnt : { $sum : 1 },
				total: { $sum : '$total'}
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
			{ $project: {'accessDate':'$fecha.emision', terminal: '$terminal', total: '$importe.total'} },
			{ $group : {
							_id : { terminal: '$terminal',
								year: { $year : "$accessDate" },
								month: { $month : "$accessDate" }
							},
							cnt : { $sum : 1 },
							total: { $sum : '$total'}
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

	function getNoMatches (req, res) {
		'use strict';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error('%s - Error: %s', dateTime.getDatetime(), err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal){
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					console.error(errMsg);
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
							var arrResult = [];
							noMatches.forEach(function (item){
								arrResult.push(item.match);
							});

							var fecha;
							var match = {};
							if (req.query.fechaInicio || req.query.fechaFin){
								match["fecha.emision"]={};
								if (req.query.fechaInicio){
									fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z')).toDate();
									match["fecha.emision"]['$gte'] = fecha;
								}
								if (req.query.fechaFin){
									fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z')).toDate();
									match["fecha.emision"]['$lt'] = fecha;
								}
							}
							match['detalle.items.id'] = { $nin: arrResult };

							var inv = Invoice.aggregate();
							inv.match({"terminal": req.params.terminal});
							inv.unwind('detalle','detalle.items');
							inv.match(match);
							inv.group({ _id:	{
								'_id':'$_id',
								'nroPtoVenta' : '$nroPtoVenta',
								'nroComprob' : '$nroComprob',
								'razon' : '$razon',
								'fecha' : '$fecha.emision',
								'impTot' : '$importe.total'
							}
							});
							inv.limit(10);

							inv.exec(function (err, data){
								inv._pipeline.splice(5,1);
								inv.group({_id: null,cnt:{$sum:1}});
								inv.exec(function (err,data2){
									var cnt = data2[0].cnt;
									var result = {
										status: 'OK',
										totalCount: cnt,
										pageCount: parseInt( ((req.params.limit > cnt)?cnt:req.params.limit) , 10),
										page: parseInt(req.params.skip, 10),
										data: data
									}
									res.send(200, {status:'OK', data: result});
								});
							});

						} else {
							console.error('%s - Error: %s', dateTime.getDatetime(), err);
							res.send(500, {status:'ERROR', data: err});
						}
					});
				}

			}
		});
	}


	app.get('/invoices/:terminal/:skip/:limit', getInvoices);
	app.get('/invoice/:id', getInvoice);
	app.get('/invoices', getInvoices);
	app.get('/invoices/counts', getCounts);
	app.get('/invoices/countsByDate', getCountByDate);
	app.get('/invoices/countsByMonth', getCountByMonth);
	app.get('/invoices/noRates/:terminal/:skip/:limit', getNoRates);
	app.get('/invoices/ratesTotal', getRatesTotal);
	app.get('/invoices/noMatches/:terminal/:skip/:limit', getNoMatches);
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