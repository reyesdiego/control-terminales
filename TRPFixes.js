/**
 * Created by diego on 9/12/14.
 */
var mongoose = require('mongoose');
var schema = mongoose.Schema;

var async = require('async');

var Invoice = require('./models/invoice.js');

console.log('Running mongoose version %s', mongoose.version);

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 */

//mongoose.connect('mongodb://localhost/terapi', function (err) {
mongoose.connect('mongodb://10.1.0.51/terapi', {
	user: 'admin',
	pass: 'Pt trend 54',
	auth:{authdb:"admin"}
}, function (err) {

	if (err) throw err;
	console.log("Connected");
	getData();
})


function getData() {

	var invoice = Invoice.find({terminal: 'TRP', cotiMoneda: {$gt: 1}, codMoneda:'PES'}).limit(500);
//	var invoice = Invoice.find({_id : "53bb09dd4966cbc275000735"});
	invoice.exec( function (err, invoices){
		if (!err){
			console.log(invoices.length);
			async.forEachSeries(invoices, function (invoice, asyncInvoiceCallback){
//				console.log("- %s %s", invoice._id, invoice.cotiMoneda);
				invoice.codMoneda = 'DOL';
				invoice.importe.gravado = (invoice.importe.gravado / invoice.cotiMoneda).toFixed(2);
				invoice.importe.noGravado = (invoice.importe.noGravado / invoice.cotiMoneda).toFixed(2);
				invoice.importe.exento = (invoice.importe.exento / invoice.cotiMoneda).toFixed(2);
				invoice.importe.subtotal = (invoice.importe.subtotal / invoice.cotiMoneda).toFixed(2);
				invoice.importe.iva = (invoice.importe.iva / invoice.cotiMoneda).toFixed(2);
				invoice.importe.otrosTributos = (invoice.importe.otrosTributos / invoice.cotiMoneda).toFixed(2);
				invoice.importe.total = (invoice.importe.total / invoice.cotiMoneda).toFixed(2);

						invoice.detalle.forEach( function( container){
							async.forEachSeries(container.items, function (item, asyncCallback){
								item.impTot = (item.impTot/invoice.cotiMoneda).toFixed(2);
								item.save(function (err, data, rowAffected) {
//									console.log("-- %s -- rowAffected %s", container.contenedor, rowAffected);
//									console.log("---- %s %s %s %s", item.cnt, item.impUnit, item.impTot, item.impTot);
//									console.log("-- updated item ok --");
									asyncCallback();
								});
							}, function (termino){
//								console.log("termino Detalles Containers");
								invoice.importe.save(function () {
//									console.log("-- updated Invoice Importe ok --");
									invoice.save(function (err, data) {
//										console.log("-- %s ok --", data._id);
//										console.log('--------------------------------------');
										asyncInvoiceCallback();
									});
								});
							});
						});

			}, function (){
				//process.exit();
				//console.log("Termino All");
			});
		}
	});

}
