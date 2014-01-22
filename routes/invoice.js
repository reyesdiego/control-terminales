//'use strict';

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
	getInvoices = function(req, res) {
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

	addInvoice = function( req, res) {
		console.log(req.method);

		var postData = '';
		req.setEncoding("utf8");

		req.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
			console.log("Receiving POST data chunk '"+postDataChunk + "'.");
		});
		req.addListener("end", function() {
			console.log("Received POST data ");

			Invoice.find().sort({numeroComprobante:-1}).limit(1).find({},function(err, data){

				var et = require('elementtree');
				var XML = et.XML;
				var ElementTree = et.ElementTree;
				var element = et.Element;
				var subElement = et.SubElement;

				var etree = et.parse(postData);

				var header = etree.find('.//comprobanteCAERequest');

				if (data[0].numeroComprobante + 1 !== parseInt(header.findtext('numeroComprobante'), 10)) {
					console.log('numeroComprobante Incorrecto: %s', data[0].numeroComprobante);
					res.send({"error":"numeroComprobante Incorrecto:"+data[0].numeroComprobante})
				}
				else {
					console.log('numeroComprobante Correcto: %s', data[0].numeroComprobante);

					var headerNew = {
						numeroComprobante:		header.findtext('numeroComprobante'),
						codigoTipoDocumento:	header.findtext('codigoTipoDocumento'),
						numeroDocumento:		header.findtext('numeroDocumento'),
						importeGravado:			header.findtext('importeGravado'),
						importeNoGravado:		header.findtext('importeNoGravado'),
						importeExento:			header.findtext('importeExento'),
						importeSubtotal:		header.findtext('importeSubtotal'),
						importeOtrosTributos:	header.findtext('importeOtrosTributos'),
						importeTotal:			header.findtext('importeTotal'),
						codigoMoneda:			header.findtext('codigoMoneda'),
						cotizacionMoneda:		header.findtext('cotizacionMoneda'),
						observaciones:			header.findtext('observaciones'),
						codigoConcepto:			header.findtext('codigoConcepto'),
						details:				[]
					}

					//_addInvoiceHeader(headerNew);

					var items = etree.findall('.//item');
					for (var i=0; i<items.length; i++) {
						var detail = {
							unidadesMtx:			items[i].findtext('unidadesMtx'),
							codigoMtx:				items[i].findtext('codigoMtx'),
							codigo:					items[i].findtext('codigo'),
							descripcion: 			items[i].findtext('descripcion'),
							cantidad:				items[i].findtext('cantidad'),
							codigoUnidadMedida:		items[i].findtext('codigoUnidadMedida'),
							precioUnitario:			items[i].findtext('precioUnitario'),
							importeBonificacion:	items[i].findtext('importeBonificacion'),
							codigoCondicionIva:		items[i].findtext('codigoCondicionIVA'),
							importeIva:				items[i].findtext('importeIVA'),
							importeItem:			items[i].findtext('importeItem')
						};
		//				var detailNew = _addInvoiceDetail(detail)
						headerNew.details.push(detail);
					}
					var invoice2add = new Invoice(headerNew);
					invoice2add.save(function(err){
						if(!err) {
							console.log('Created');
							console.log("items:%s inserted", items.length);
							res.send(invoice2add);
						} else {
							console.log('ERROR: ' + err);
						}
					});
				}
			});
		});
	};

	removeInvoices = function( req, res){
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
