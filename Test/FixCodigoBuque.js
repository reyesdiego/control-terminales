/**
 * Created by diego on 1/6/15.
 */
var mongoose = require('mongoose');
var schema = mongoose.Schema;

var async = require('async');

var invoice = require('./../models/invoice.js');

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
	updateData();
})


function updateData() {

	var inv = invoice.find(
	{
			terminal:"TRP",
//			'detalle.buque.nombre': '',
//			'detalle.buque.viaje': '',
			'detalle.buque.codigo': {$ne:''}
	});
	inv.limit(10);
	inv.exec( function (err, data){

		async.forEachSeries( data, function(header, asyncCallback){
				header.detalle.forEach(function (item){

					var codigoTrim = item.buque.codigo.trim();
					if ( codigoTrim === '') {
						console.log("Codigo: '%s'", item.buque.codigo);
						item.buque.codigo = codigoTrim;
					}

//					header.save(function (err, dataSaved){
////						console.log ("Fixed: %s", item._id);
//						asyncCallback();
//					});

				});
		}, function (){
			console.log("TERMINO TODO");
			mongoose.disconnect();
			process.exit(0);
		});


		}
	);
/*
		async.forEachSeries( data, function(item, asyncCallback){


		});*/


}
