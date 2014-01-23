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

	//GET - Return all invoiceHeaders in the DB
	function getInvoices (req, res) {
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			Invoice.find(function(err, invoices) {
				if(!err) {
					res.send(invoices);
				} else {
					console.log('ERROR: ' + err);
				}
			});
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

			Account.verifyToken(incomingToken, function(err, usr) {
				Invoice.find({terminal:usr.terminal}).sort({numeroComprobante:-1}).limit(1).find({},function(err, data){

					var previousInvoice;
					if (data.length>0) previousInvoice = data[0];

					var et = require('elementtree');
					var XML = et.XML;
					var ElementTree = et.ElementTree;
					var element = et.Element;
					var subElement = et.SubElement;

					var etree = et.parse(postData);

					var header = etree.find('.//comprobanteCAERequest');

					if ((previousInvoice !== undefined && previousInvoice.numeroComprobante + 1 === parseInt(header.findtext('numeroComprobante'), 10))
						|| previousInvoice === undefined ) {

						console.log('numeroComprobante Correcto: %s', header.findtext('numeroComprobante'));

						var headerNew = {
							terminal: usr.terminal,
							numeroComprobante: header.findtext('numeroComprobante'),
							codigoTipoDocumento: header.findtext('codigoTipoDocumento'),
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
							details: []
						}

						//_addInvoiceHeader(headerNew);


						var items = etree.findall('.//item');
						items.forEach( function (item) {
							var detail = {
								unidadesMtx: item.findtext('unidadesMtx'),
								codigoMtx: item.findtext('codigoMtx'),
								codigo: item.findtext('codigo'),
								descripcion: item.findtext('descripcion'),
								cantidad: item.findtext('cantidad'),
								codigoUnidadMedida: item.findtext('codigoUnidadMedida'),
								precioUnitario: item.findtext('precioUnitario'),
								importeBonificacion: item.findtext('importeBonificacion'),
								codigoCondicionIva: item.findtext('codigoCondicionIVA'),
								importeIva: item.findtext('importeIVA'),
								importeItem: item.findtext('importeItem')
							};
							//				var detailNew = _addInvoiceDetail(detail)
							headerNew.details.push(detail);
						});
						var invoice2add = new Invoice(headerNew);
						invoice2add.save(function (err) {
							if (!err) {
								console.log('Created');
								console.log("items:%s inserted", items.length);
								res.send(invoice2add);
							} else {
								console.log('ERROR: ' + err);
							}
						});
					} else {
						console.log('numeroComprobante Incorrecto: %s', header.findtext('numeroComprobante'));
						res.send({"error": "numeroComprobante Incorrecto:" + header.findtext('numeroComprobante')})
					}
				});
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
			else{
				res.send(err);
			}
		});
	};

	app.get('/invoices', getInvoices);
	app.post('/invoice', addInvoice);
	app.delete('/invoices/:_id', removeInvoices);

	app.get('/test', function(req, res){
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (!err){
				console.log(usr);
				res.send({"test":"OK", user: usr});
			}
			else{
				res.send(err);
			}
		});
	})
}
