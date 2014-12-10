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
module.exports = function(app, io, log) {

	var Invoice = require('../models/invoice.js');
	var Gate = require('../models/gate.js');
	var MatchPrice = require('../models/matchPrice.js');
	var Comment = require('../models/comment.js');

	//GET - Return all invoice in the DB
	function getInvoices (req, res) {

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {
				var fecha;

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {

					var ter = (usr.role === 'agp')?paramTerminal:usr.terminal;
					var param = {
						terminal:	ter
					};

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
					if (req.query.nroPtoVenta){
						param.nroPtoVenta = req.query.nroPtoVenta;
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

					if (req.query.buqueNombre)
						param['detalle.buque.nombre'] = req.query.buqueNombre;

					if (req.query.viaje)
						param['detalle.buque.viaje'] = req.query.viaje;

					if (req.query.code)
						param['detalle.items.id'] = req.query.code;

					if (req.query.estado){
						var states = req.query.estado.split(",");
						param['$or'] = [
							{ estado:{$size: 1, $elemMatch: {estado: {$in: states}, grupo:'ALL'} } },
							{ 'estado.1': { $exists: true } , estado: {$elemMatch: {estado: {$in: states}, grupo: usr.group} } }
						]
					}
				}

				var invoices = Invoice.find(param);

				var limit = parseInt(req.params.limit, 10);
				var skip = parseInt(req.params.skip, 10);

				invoices.limit(limit).skip(skip);
				if (req.query.order){
					var order = JSON.parse(req.query.order);
					invoices.sort(order[0]);
				} else {
					invoices.sort({codTipoComprob:1, nroComprob:1});
				}

				invoices.exec(function(err, invoices) {
					if(!err) {
						Invoice.count(param, function (err, cnt){
							var result = {
								status: 'OK',
								totalCount: cnt,
								pageCount: (req.params.limit > cnt)?cnt:req.params.limit,
								page: skip,
								data: invoices
							}
							res.send(200, result);
						});
					} else {
						log.logger.error("Error: %s", err);
						res.send(500 , {status: "ERROR", data: err});
					}
				});
			}
		});
	}

	function getInvoice(req, res) {
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
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
						log.logger.error("Error: %s", err.error);
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
					log.logger.error(strBody);
					var mailer = new mail.mail(config.email);
					mailer.send(usr.email, strSubject, strBody);
					res.send(500, {status:"ERROR", data: strBody} );
					return;
				}

				if (err) {
					var errMsg = util.format("%s - Error: %s", dateTime.getDatetime(), err.error);
					log.logger.error(errMsg);
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
							razon:			postData.razon.trim(),
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
							otrosTributos:	[],
							estado: 		[
								{
									estado	:	"Y",
									grupo	:	"ALL",
									user	:	usr.user
								}
							],
							comment: []
						};

						if (postData.otrosTributos)
							postData.otrosTributos.forEach(function (item){

								var otId = (item.id !== undefined) ? item.id.toString() : null;
								var otDesc = item.desc;
								invoice.otrosTributos.push(
									{
										id:			(otId) ? otId : "",
										desc	:	(otDesc) ? otDesc.trim() : "",
										imponible:	item.imponible,
										imp:		item.imp
									})
							});

						var subTotalCheck=0;
						if ( postData.detalle && postData.detalle.length > 0 ){
							postData.detalle.forEach(function (container){
								var buqueId = (container.buqueId !== undefined && container.buqueId !== null) ? container.buqueId.toString() : null;
								var buqueDesc = container.buqueDesc;
								var viaje = container.viaje;
								var fecha = (container.fecha !== undefined) ? moment(container.fecha) : null;
								var buque = {
									codigo: (buqueId) ? buqueId : "",
									nombre: (buqueDesc) ? buqueDesc.trim() : "",
									viaje: (viaje) ? viaje.trim() : "",
									fecha: fecha
								};
								var contenedor = container.contenedor;
								var cont = {
									contenedor:		(contenedor) ? container.contenedor.trim() : "",
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
										subTotalCheck += item.impTot;
									});
								} else {
									var errMsg = util.format("Error Invoice INS: %s", "El contenedor no posee items.");
									log.logger.error(errMsg);
									res.send(500, {status:"ERROR", data: errMsg});
									return;
								}
								invoice.detalle.push(cont);
							});

						} else {
							var errMsg = util.format("Error Invoice INS: %s - %s. - %j", "El comprobante no posee detalles.", usr.terminal, postData);
							log.logger.error(errMsg);
							res.send(500, {status:"ERROR", data: errMsg});
							return;
						}

					} catch (error){
						var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
						var body = util.format('Error al insertar comprobante. %s. \n%s',  error.message, JSON.stringify(postData));

						log.logger.error(body);

						var mailer = new mail.mail(config.email);
						mailer.send(usr.email, strSubject, body, function(){
						});
						res.send(500, {"status":"ERROR", "data": body});
						return;
					}

					var invoice2add = new Invoice(invoice);
					invoice2add.save( function (errSave, data) {
						if (!errSave) {
							log.logger.insert("Invoice INS: %s - %s - Tipo: %s Nro: %s - %s", data._id, usr.terminal, postData.codTipoComprob, postData.nroComprob, postData.fechaEmision);

							var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
							io.sockets.emit('invoice', socketMsg);

							var comment = 'Comprobante transferido correntamente.';
							var commentState = 'Y';

							if ( ( subTotalCheck > postData.impSubtot + 1) || ( subTotalCheck < postData.impSubtot - 1) ){
								comment = util.format("El subtotal del comprobante es incorrecto, la suma es %d y se informa %d. - %s.", subTotalCheck, postData.impSubtot, usr.terminal);
								data.estado[0].estado = 'R';
							}

							Comment.create({
								invoice: data._id,
								title: 'Transferencia comprobante.',
								comment: comment,
								state: commentState,
								user: usr.user,
								group: "ALL"
							}, function (err, commentAdded){
								if (err){

								} else {
									data.comment.push(commentAdded._id);
									data.save(function (){
										res.send(200,{status: "OK", data: data});
									});
								}
							});

						} else {
							//TODO crear objecto para tratar los errores, en este caso trato el tema de duplicados.
							if (errSave.code === 11000){
								Invoice.find({
									terminal:		usr.terminal,
									codTipoComprob:	invoice.codTipoComprob,
									nroComprob:		invoice.nroComprob,
									nroPtoVenta:	invoice.nroPtoVenta
								}, function (err, invoice){
//									var errMsg = util.format('%s - Error INS: El tipo de comprobante: %s, número: %s, fue transferido el %s:\n %s\n\n%s - ERROR:%s\n\n%s', dateTime.getDatetime(), invoice[0].codTipoComprob, invoice[0].nroComprob, dateTime.getDateTimeFromObjectId(invoice[0]._id), invoice[0], moment(), errSave, JSON.stringify(postData));
									var errMsg = util.format('Error INS: El tipo de comprobante: %s, número: %s, fue transferido el %s:\n %s\n\n%s - ERROR:%s', invoice[0].codTipoComprob, invoice[0].nroComprob, dateTime.getDateTimeFromObjectId(invoice[0]._id), invoice[0], moment(), errSave);

									var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
									//console.error(errMsg);
									log.logger.error('error', errMsg, { data: postData});

									var mailer = new mail.mail(config.email);
									mailer.send(usr.email, strSubject, errMsg, function(){
									});

									res.send(500, {status: "ERROR", data: errMsg});
								})
							} else {
								var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
								var strError = util.format('Error INS: %s -\n%s', errSave, JSON.stringify(postData));
								log.logger.error(strError);

								var mailer = new mail.mail(config.email);
								mailer.send(usr.email, strSubject, strError, function(){
								});

								res.send(500, {status: "ERROR", data: strError});
							}

						}
					});

				}
			});
		});
	}

	function updateInvoice (req, res) {

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(403, {status:'ERROR', data: err});
			} else {

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {

					var param = {_id: req.params._id, terminal: paramTerminal};

					Invoice.findOneAndUpdate(param, { $set: req.body}, null, function (err, data) {
						if  (err) {
							var errMsg = util.format("Error: %s", err.error);
							log.logger.error(errMsg);
							res.send(500, {status: "ERROR", data: errMsg});
						} else {
							res.send(200, {"status": "OK", "data": data})
						}
					});
				}
			}
		});
	}

	function setState (req, res) {

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(err);
				res.send(403, {status:'ERROR', data: err});
			} else {
				var invoice = Invoice.update({_id: req.params._id, 'estado.grupo': usr.group},
					{$set: {'estado.$.estado' : req.body.estado}},
					function (err, rowAffected, data, data2){
						if (err) {
							var errMsg = util.format('Error: %s', 'Error in invoice set state.');
							log.logger.error(errMsg);
							res.send(500, {status:'ERROR', data: errMsg});
						} else  {

							if (rowAffected === 0){
								Invoice.findByIdAndUpdate( req.params._id,
									{ $push: { estado: { estado: req.body.estado, grupo: usr.group, user: usr.user } } },
									{safe: true, upsert: true},
									function (err, data ){
										if (err) {
											var errMsg = 'Error: Error in invoice set state.';
											log.logger.error(errMsg);
											res.send(500, {status:'ERROR', data: errMsg});
										} else {
											res.send(200, {status:'OK', data: data});
										}
									});
							} else {
								res.send(200, {status:'OK', data: data});
							}
						}
					});
			}
		});
	}

	function removeInvoices ( req, res){
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (!err){
				console.log(usr);
				Invoice.remove({_id: req.params._id}, function (err){
					if (!err){
						log.logger.info('Invoice Removed %s', req.params._id);
						res.send({"response": "OK"});
					} else {
						res.send({"error": "Error al intentar eliminar"});
					}
				});
			}
			else {
				log.logger.error(err);
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
				log.logger.error(err);
				res.send(err, {"content-type":"text/plain"}, 500);
			}
		});
	}

	function getCountByDate (req, res) {

		var date = moment(moment().format('YYYY-MM-DD'));
		if (req.query.fecha !== undefined){
			date = moment(moment(req.query.fecha).format('YYYY-MM-DD'));
		}
		var date5Ago = moment(date).subtract('days', 4).toDate();
		var tomorrow = moment(date).add('days', 1).toDate();

		var sum = {};
		if (req.params.currency === 'PES')
			sum = { $cond: [
				{$eq:['$codMoneda', 'PES' ]},
				'$importe.total',
				{$multiply:['$importe.total','$cotiMoneda'] }
			]
			};
		else if (req.params.currency === 'DOL')
			sum = { $cond: [
				{$eq:['$codMoneda', 'DOL' ]},
				'$importe.total',
				{$divide:['$importe.total','$cotiMoneda'] }
			]
			};

		var jsonParam = [
			{$match: { 'fecha.emision': {$gte: date5Ago, $lt: tomorrow} }},
			{ $project: {'accessDate':'$fecha.emision', terminal: '$terminal', total: sum} },
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
			if (err){
				res.send(500, {status:"ERROR", data: err.message});
			} else {
				res.send(200, {status: 'OK', data: data});
			}
		});

	}

	function getCountByMonth (req, res) {
		var date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date()-1);
		if (req.query.fecha !== undefined){
			date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date()-1);
		}
		var month5Ago = moment(date).subtract('months',4).toDate();
		var nextMonth = moment(date).add('months',1).toDate();

		var sum = {};
		if (req.params.currency === 'PES')
			sum = { $cond: [
				{$eq:['$codMoneda', 'PES' ]},
				'$importe.total',
				{$multiply:['$importe.total','$cotiMoneda'] }
			]
			};
		else if (req.params.currency === 'DOL')
			sum = { $cond: [
				{$eq:['$codMoneda', 'DOL' ]},
				'$importe.total',
				{$divide:['$importe.total','$cotiMoneda'] }
			]
			};

		var jsonParam = [
			{$match: { 'fecha.emision': {$gte: month5Ago, $lt: nextMonth} }},
			{ $project: {'accessDate':'$fecha.emision', terminal: '$terminal', total: sum} },
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
				res.send(500, {status:"ERROR", data: err.message});
			} else {
				res.send(200, {status: 'OK', data: data});
			}
		});

	}

	function getNoRates (req, res) {

		log.startElapsed();

		var terminal = req.params.terminal;

		var _price = require('../include/price.js');
		var _rates = new _price.price();

		_rates.rates(function (err, rates){

			if (rates.length>0){

				var skip = parseInt(req.params.skip, 10);
				var limit = parseInt(req.params.limit, 10);

				var fecha;

				var param = {
					terminal : terminal,
					'detalle.items.id': {$nin: rates}
				}

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

				if (req.query.contenedor){
					param['detalle.contenedor'] = req.query.contenedor;
				}

				if (req.query.razonSocial){
					param.razon = {$regex:req.query.razonSocial}
				}

				var invoices = Invoice.find(param);
				invoices.limit(limit).skip(skip);

				if (req.query.order){
					var order = JSON.parse(req.query.order);
					invoices.sort(order[0]);
				} else {
					invoices.sort({codTipoComprob:1, nroComprob:1});
				}

				invoices.exec(function(err, invoices){
					Invoice.count(param, function (err, cnt){
						var dataResult = {
							status: 'OK',
							totalCount: cnt,
							pageCount: (req.params.limit > cnt) ? cnt : req.params.limit,
							page: skip,
							elapsed: log.getElapsed(),
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

			var sum = {};
			if (req.params.currency === 'PES')
				sum = { $cond: [
					{$eq:['$codMoneda', 'PES' ]},
					'$detalle.items.impTot',
					{$multiply:['$detalle.items.impTot','$cotiMoneda'] }
				]
				};
			else if (req.params.currency === 'DOL')
				sum = { $cond: [
					{$eq:['$codMoneda', 'DOL' ]},
					'$detalle.items.impTot',
					{$divide:['$detalle.items.impTot','$cotiMoneda'] }
				]
				};

			var jsonParam = [
				{	$match : {'fecha.emision': {$gte: today, $lt: tomorrow}}},
				{	$unwind : '$detalle'},
				{	$unwind : '$detalle.items'},
				{	$match : {'detalle.items.id' : {$in: rates}}},
				{	$project : {terminal: 1, 'detalle.items': 1, "total" : sum }},
				{
					$group  : {
						_id: { terminal: '$terminal'},
						cnt: { $sum: 1},
						total: {$sum: '$total'}
					}
				}
			];
			Invoice.aggregate(jsonParam, function (err, data){
				if (err)
					res.send(500, {status:'ERROR', data: err.message });
				else
					res.send(200, {
						status:'OK',
						data: data }
					);
			});
		});

	}

	function getRatesByContainer (req, res){
		var moment = require('moment');

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {

				var today = moment(moment().format('YYYY-MM-DD')).toDate();
				var tomorrow = moment(moment().format('YYYY-MM-DD')).add('days',1).toDate();
				if (req.query.fecha !== undefined){
					today = moment(moment(req.query.fecha).format('YYYY-MM-DD')).toDate();
					tomorrow = moment(moment(req.query.fecha).format('YYYY-MM-DD')).add('days',1).toDate();
				}

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					console.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {

					var ter = (usr.role === 'agp')?paramTerminal:usr.terminal;

					var _price = require('../include/price.js');
					var _rates = new _price.price();
					_rates.rates(function (err, rates){

						var sum = {};
						if (req.params.currency === 'PES')
							sum = { $cond: [
								{$eq:['$codMoneda', 'PES' ]},
								'$detalle.items.impTot',
								{$multiply:['$detalle.items.impTot','$cotiMoneda'] }
							]
							};
						else if (req.params.currency === 'DOL')
							sum = { $cond: [
								{$eq:['$codMoneda', 'DOL' ]},
								'$detalle.items.impTot',
								{$divide:['$detalle.items.impTot','$cotiMoneda'] }
							]
							};

						var jsonParam = [
							{	$match: {
											terminal:	ter,
											'detalle.items.id' : {$in: rates},
											'detalle.contenedor' : req.params.container
										}
							},
							{	$unwind : '$detalle'	},
							{	$unwind : '$detalle.items'	},
							{	$match : {
											'detalle.items.id' : {$in: rates},
											'detalle.contenedor' : req.params.container
										}
							},
							{	$project : {terminal: 1, 'detalle.items': 1, total : sum }
							},
							{
								$group  : {
									_id: {
											terminal: '$terminal',
											id: '$detalle.items.id'
									},
									cnt: { $sum: '$detalle.items.cnt'},
									total: {$sum: '$total'}
								}
							}
						];
						Invoice.aggregate(jsonParam, function (err, data){
							if (err)
								res.send(500, {status:'ERROR', data: err.message });
							else
								res.send(200, {status:'OK', data: data });
						});
					});
					}
			}
		});

	}

	function getNoMatches (req, res) {
		'use strict';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error('Error: %s', err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {

				var skip = parseInt(req.params.skip, 10);
				var limit = parseInt(req.params.limit, 10);

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal){
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
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
									match["fecha.emision"]['$lte'] = fecha;
								}
							}
							match['detalle.items.id'] = { $nin: arrResult };

							var inv = Invoice.aggregate();
							inv.match({"terminal": req.params.terminal});
							inv.unwind('detalle','detalle.items');
							inv.match(match);
							inv.group({ _id:{
								'_id':'$_id',
								'nroPtoVenta' : '$nroPtoVenta',
								'nroComprob' : '$nroComprob',
								'razon' : '$razon',
								'codMoneda': '$codMoneda',
								'cotiMoneda': '$cotiMoneda',
								'fecha' : '$fecha.emision',
								'impTot' : '$importe.total'
							}
							});
							inv.sort({'_id.fecha':-1});
							inv.skip(skip);
							inv.limit(limit);

							inv.exec(function (err, data){

								if (!err){
									if (data.length > 0){
										inv._pipeline.splice(6,2);
										inv.group({_id: null,cnt:{$sum:1}});
										inv.exec(function (err, data2) {
											var cnt = data2[0].cnt;
											var result = {
												status: 'OK',
												totalCount: cnt,
												pageCount: (req.params.limit > cnt)? cnt : req.params.limit,
												page: skip,
												data: data
											}
											res.send(200, result);
										});
									} else {
										res.send(200, { status:'OK', data: [] });
									}
								}
							});

						} else {
							log.logger.error('Error: %s', err);
							res.send(500, {status:'ERROR', data: err.message});
						}
					});
				}

			}
		});
	}

	function getInvoicesByRates (req, res) {

		var ratesParam = req.body.data;
		if (ratesParam.length<1){

		} else {

			var Enumerable = require('linq');

			var dateIni = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD')).toDate();
			var dateFin = moment(moment(req.query.fechaFin).format('YYYY-MM-DD')).toDate();

			var param = [
				{ $match: { code: {$in: ratesParam } } },
				{ $unwind: '$match'},
				{ $project : {code: '$code',  match: '$match', _id: false}}
			];
			MatchPrice.aggregate(param, function (err, matchprices) {
				var ids =[];
				matchprices.forEach(function (item){
					ids.push(item.match);
				});

				param = [
					{
						$match : { 'fecha.emision': { $gte: dateIni, $lte: dateFin }  }
					},
					{
						$unwind : '$detalle'
					},
					{
						$unwind : '$detalle.items'
					},
					{
						$match : {
							'detalle.items.id' : {$in: ids }
						}
					},
					{
						$group  : {
							_id: { terminal: '$terminal', code: '$detalle.items.id'},
							total: { $sum : '$detalle.items.impTot'}
						}
					},
					{
						$project : { _id:0, terminal: '$_id.terminal', code: '$_id.code', total:1}
					}
				];

				var rates = Invoice.aggregate(param);
				rates.exec( function (err, ratesData){
					if (err){
						log.logger.error(err);
						res.send(500, {status:"ERROR", data: err.message});
					}
					else {
						var response = Enumerable.from(ratesData)
								.join(Enumerable.from(matchprices), '$.code', '$.match', function (rate, matchprice){
								rate.code = matchprice.code;
								return rate;
								}).toArray();
						var result = Enumerable.from(response).groupBy("{code: $.code, terminal: $.terminal}", null,
							function (key, g) {
								var result = {
									terminal: key.terminal
								};
								result[key.code] = g.sum("$.total");
								return result;
							}).toArray();

						var result2 = Enumerable.from(result).groupBy("$.terminal" , null,
							function (key, g) {
								var prop = g.getSource();
								var ter = {terminal: key, data: {}};
								prop.forEach(function (item){
									for (var pro in item){
										if (pro !== 'terminal')
											ter.data[pro]= item[pro];
									}
								});
								return (ter);
							}).toArray();
						res.send(200, {status:'OK', data: result2});
					}
				});
			});
		}

	}

	function getCorrelative (req, res) {

		var functionIni = log.moment();

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
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
				if (req.query.nroPtoVenta) {
					param.nroPtoVenta = parseInt( req.query.nroPtoVenta, 10);
				}
				if (req.query.codTipoComprob){
					param.codTipoComprob = parseInt( req.query.codTipoComprob, 10);
				}

				if (usr.role === 'agp')
					param.terminal = req.params.terminal;
				else
					param.terminal = usr.terminal;

				var invoices = Invoice.find(param, {nroComprob:1, _id: 0});

				if (req.query.order){
					var order = JSON.parse(req.query.order);
					invoices.sort(order[0]);
				} else {
					invoices.sort({nroComprob:1});
				}

				invoices.exec(function(err, invoices) {
					if(!err) {
						var faltantes = [];
						var control = 0;
						var contadorFaltantes = 0;

						invoices.forEach(function(invoice){
							if (control == 0){
								control = invoice.nroComprob
							} else {
								control += 1;
								if (control != invoice.nroComprob){
									if (invoice.nroComprob - control > 3){
										var dif = (invoice.nroComprob) - control;
										contadorFaltantes+=dif;
										var item2Add = util.format('[%d a %d] (%d)', control, (invoice.nroComprob - 1), dif);
										faltantes.push(item2Add);
									} else {
										for (var i=control, len=invoice.nroComprob ; i<len;i++){
											faltantes.push(i.toString());
											contadorFaltantes++;
										}
									}
									control = invoice.nroComprob;
								}
							}
						});
						var functionFin = log.moment();
						var result = {
							status: 'OK',
							totalCount: contadorFaltantes,
							elapsed: functionIni.diff(functionFin)*(-1),
							data: faltantes
						};
						res.send(200, result);
					} else {
						log.logger.error("Error: %s", err.message);
						res.send(500 , {status: "ERROR", data: {name: err.name, message: err.message} });
					}
				});
			}
		});
	}

	function getCashbox (req, res){

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {
				var fecha;

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {

					var ter = (usr.role === 'agp')?paramTerminal:usr.terminal;
					var param = {terminal:	ter};

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
					if (req.query.nroPtoVenta){
						param.nroPtoVenta = req.query.nroPtoVenta;
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

					if (req.query.estado){
						param['$or'] = [
							{ estado:{$size: 1, $elemMatch: {estado: req.query.estado, grupo:'ALL'} } },
							{ 'estado.1': { $exists: true } , estado: {$elemMatch: {estado: req.query.estado, grupo: usr.group} } }
						]
					}
				}

				Invoice.distinct('nroPtoVenta', param, function (err, data){
					if (err){
						res.send(500, {status: 'ERROR', data: err.message});
					} else {
						res.send(200, {status: 'OK', data: data.sort()});
					}
				});
			}
		})
	}

	function getDistincts( req, res) {

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {
				var distinct = '';

				if (req.route.path === '/invoices/:terminal/ships')
					distinct = 'detalle.buque.nombre';

				if (req.route.path === '/invoices/:terminal/containers')
					distinct = 'detalle.contenedor';

				if (req.route.path === '/invoices/:terminal/clients')
					distinct = 'razon';

				var param = {};
				if (usr.role === 'agp')
					param.terminal = req.params.terminal;
				else
					param.terminal = usr.terminal;

				Invoice.distinct(distinct, param, function (err, data){
					if (err){
						res.send(500, {status: 'ERROR', data: err.message});
					} else {
						res.send(200, {status: 'OK', data: data.sort()});
					}
				});
			}
		});

	}

	function getShipTrips (req, res) {

		var incomingToken = req.headers.token;

		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {

					var ter = (usr.role === 'agp')?paramTerminal:usr.terminal;
					var param = {terminal:	ter};

					Invoice.aggregate([
						{ $match: param },
						{ $unwind : '$detalle'},
						{ $group: {_id: {buque: '$detalle.buque.nombre', viaje: '$detalle.buque.viaje'} } },
						{ $sort: { '_id.buque': 1, '_id.viaje': 1} },
						{ $project : {buque: '$_id.buque', viaje: '$_id.viaje', _id:false}}
					], function (err, data){
						if (err) {
							res.send(500, {status: 'ERROR', data: err.message});
						} else {
							var Enumerable = require('linq');
							var result = Enumerable.from(data)
								.groupBy("$.buque" , null,
									function (key, g) {
										var prop = g.getSource();
										var ter = {buque: key, viajes: []};
										prop.forEach(function (item){
											for (var pro in item){
												if (pro !== 'buque')
													ter.viajes.push(item[pro]);
											}
										});
										return (ter);
									}).toArray();

							res.send(200, {status: 'OK', data: result});
						}
					});
				}
			}
		});
	}

	function getShipContainers (req, res) {

		log.startElapsed();

		var incomingToken = req.headers.token;

		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {

				var paramTerminal = req.params.terminal;

				if (usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {

					var ter = (usr.role === 'agp')?paramTerminal:usr.terminal;
					var param = {terminal:	ter};

					var buque = req.query.buqueNombre;
					var viaje = req.query.viaje;

					Invoice.aggregate([
						{ $match: param },
						{ $unwind : '$detalle'},
						{ $match: {'detalle.buque.nombre': buque, "detalle.buque.viaje" : viaje} },
						{ $group: {_id: {buque: '$detalle.buque.nombre', viaje: "$detalle.buque.viaje", contenedor: '$detalle.contenedor'} } },
						{ $project: {contenedor: '$_id.contenedor', _id: false}},
						{ $sort: {contenedor: 1} }
					], function (err, dataContainers){
						if (err) {
							res.send(500, {status: 'ERROR', data: err.message});
						} else {
							Gate.find({buque: buque, viaje: viaje}, function (err, dataGates){
								if (err) {
									res.send(500, {status: 'ERROR', data: err.message});
								} else {
									var Enumerable = require('linq');

									var response = Enumerable.from(dataContainers)
										.groupJoin(dataGates, '$.contenedor', '$.contenedor', function (inner,outer){
											var result = {
												contenedor:'',
												gates: []
											};
											if (outer.getSource !== undefined)
												result.gates =outer.getSource();

											result.contenedor = inner;
											return result;
										}).toArray();

									res.send(200, {
										status: 'OK',
										elapsed: log.getElapsed(),
										data: response}
									);
								}
							});
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
	app.get('/invoices/countsByDate/:currency', getCountByDate);
	app.get('/invoices/countsByMonth/:currency', getCountByMonth);
	app.get('/invoices/noRates/:terminal/:skip/:limit', getNoRates);
	app.get('/invoices/ratesTotal/:currency', getRatesTotal);
	app.get('/invoices/rates/:terminal/:container/:currency', getRatesByContainer);
	app.get('/invoices/noMatches/:terminal/:skip/:limit', getNoMatches);
	app.get('/invoices/correlative/:terminal', getCorrelative);
	app.get('/invoices/cashbox/:terminal', getCashbox);
	app.post('/invoice', addInvoice);
	app.put('/invoice/:terminal/:_id', updateInvoice);
	app.put('/invoice/setState/:terminal/:_id', setState);
	app.delete('/invoices/:_id', removeInvoices);
	app.get('/invoices/:terminal/ships', getDistincts);
	app.get('/invoices/:terminal/containers', getDistincts);
	app.get('/invoices/:terminal/clients', getDistincts);
	app.get('/invoices/:terminal/shipTrips', getShipTrips);
	app.get('/invoices/:terminal/shipContainers', getShipContainers);

	app.post('/invoices/byRates', getInvoicesByRates);

};