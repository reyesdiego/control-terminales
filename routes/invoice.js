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
module.exports = function(app) {

	var Invoice = require('../models/invoice.js');

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
	};

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
						codTipoComprob:	postData.codTipoComprob.toString().trim(),
						nroPtoVenta:	postData.nroPtoVenta,
						nroComprob:		postData.nroComprob,
						codTipoAutoriz:	postData.codTipoAutoriz,
						codAutoriz:		postData.codAutoriz,
						fechaVto:		postData.fechaVto,
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
											emision:	postData.fechaEmision,
											vcto:		postData.fechaVcto,
											desde:		postData.fechaServDesde,
											hasta:		postData.fechaServHasta,
											vctoPago:	postData.fechaVctoPago
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
							console.log("%s - Invoice INS:%s - %s", dateTime.getDatetime(), data._id, usr.terminal);
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
	};

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


	app.get('/invoices/:skip/:limit', getInvoices);
	app.get('/invoice/:id', getInvoice);
	app.get('/invoices', getInvoices);
	app.post('/invoice', addInvoice);
	app.delete('/invoices/:_id', removeInvoices);


	app.get('/aggregate', function (req,res){

		var agg = Invoice.aggregate([
			{   $group: {
							_id: {terminal:'$terminal'},
							invoicesCount: {$sum: 1}
						}
			}
		], function (err, data){
			if (err){
				console.error(err);
				res.send(err, {"content-type":"text/plain"}, 500);
			} else {
				res.send({status:"OK", data: data}, {"content-type":"applicacion/json"}, 200);
			}
		});
	});

}