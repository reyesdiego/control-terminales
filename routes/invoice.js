/**
 * Created by Diego Reyes on 2/17/14.
 */

'use strict';

var path = require('path');
var Account = require(path.join(__dirname, '..', '/models/account'));

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
				console.log(usr);
				res.send(err);
			} else {
				Invoice.find({terminal: usr.terminal}).limit(5).exec(function(err, invoices) {
					if(!err) {
						res.send(invoices);
					} else {
						console.log('ERROR: ' + err);
					}
				});
			}
		});

	};

	function addInvoice ( req, res) {
		console.log(req.method);

		var postData = '';
		req.setEncoding("utf8");

		req.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
//			console.log("Receiving POST data chunk '"+postDataChunk + "'.");
		});
		req.addListener("end", function() {
			console.log("Received POST data ");
			var incomingToken = req.headers.token;
			postData = JSON.parse(postData);
//			Account.verifyToken(incomingToken, function(err, usr) {

				var previousInvoice;
var err;
				if (err) {
					console.log(err);
					res.send(err);
				} else {
console.log(postData);

					var invoice = {
					terminal:	"BACTSSA",
					codTipoComprob:	postData.codTipoComprob,
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
					buque:			{
										codigo:	postData.codigo,
										nombre:	postData.nombre,
										viaje:	postData.viaje
									},
					detalle:		[],
					otrosTributos:	[]
					}

					postData.detalle.forEach(function (container){
						var cont = {
							contenedor:		container.contenedor,
							items: []
						};
						container.items.forEach(function (item){
							cont.items.push(
							{
								id:			item.id,
								cnt:		item.cnt,
								uniMed:		item.uniMed,
								impUnit:	item.impUni,
								impIva:		item.impIva,
								impTot:		item.impTot
							});
						});
						invoice.detalle.push(cont);
					});
					var invoice2add = new Invoice(invoice);
					invoice2add.save(function (err) {
						if (!err) {
							res.send(invoice2add);
						} else {
							console.log('ERROR: ' + err);
							res.send({"error": 'ERROR: ' + err})
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

console.log(invoice);
					return;
					Invoice.find({terminal: usr.terminal, codigoTipoComprobante: codigoTipoComprobante}).sort({numeroComprobante: -1}).limit(1).find({}, function (err, data) {

						if (data.length > 0) previousInvoice = data[0];

						if (1===1 || (previousInvoice !== undefined && previousInvoice.numeroComprobante + 1 === parseInt(header.findtext('numeroComprobante'), 10))
							|| previousInvoice === undefined) {

							console.log('numeroComprobante Correcto: %s', header.findtext('numeroComprobante'));

							var headerNew = {
								terminal: usr.terminal,
								codigoTipoComprobante: header.findtext('codigoTipoComprobante'),
								numeroComprobante: header.findtext('numeroComprobante'),
								codigoTipoDocumento: header.findtext('codigoTipoDocumento'),
								fechaEmision: header.findtext('fechaEmision'),
								numeroDocumento: header.findtext('numeroDocumento'),
								importeGravado: header.findtext('importeGravado'),
								importeNoGravado: header.findtext('importeNoGravado'),
								importeExento: header.findtext('importeExento'),
								importeSubtotal: header.findtext('importeSubtotal'),
								importeOtrosTributos: header.findtext('importeOtrosTributos'),
								importeTotal: header.findtext('importeTotal'),
								codigoMoneda: header.findtext('codigoMoneda'),
								cotizacionMoneda: header.findtext('cotizacionMoneda'),
								observaciones: header.findtext('observaciones'),
								codigoConcepto: header.findtext('codigoConcepto'),
								buque: {
									codigo: header.findtext('buqueCodigo'),
									nombre: header.findtext('buqueDescripcion'),
									viaje: header.findtext('viaje')
								},
								details: []
							}


							invoice2add.save(function (err) {
								if (!err) {
									console.log('Created with %s Items.', items.length);
									res.send(invoice2add);
								} else {
									console.log('ERROR: ' + err);
									res.send({"error": 'ERROR: ' + err})
								}
							});
						} else {
							var nextOne = '';
							if (previousInvoice !== undefined){
								nextOne = previousInvoice.numeroComprobante + 1;
							}

							console.log('numeroComprobante Incorrecto: %s, numero correcto: %s', header.findtext('numeroComprobante'), nextOne);
							res.send({"error": 'numeroComprobante Incorrecto:' + header.findtext('numeroComprobante') + ', numeroComprobante correcto:' + nextOne})
						}
					});
				}
			});
//		});
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

	app.get('/invoices', getInvoices);
	app.post('/invoice', addInvoice);
	app.delete('/invoices/:_id', removeInvoices);

	app.get('/test', function(req, res){
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err) {
				res.send(err);
			} else {
				console.log(usr);
				res.send({"test": "OK", user: usr});
			}
		});
	})
}

