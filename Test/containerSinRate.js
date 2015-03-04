/**
 * Created by diego on 3/3/15.
 */

var mongoose = require('mongoose');
var schema = mongoose.Schema;
var moment = require('moment');
var async = require('async');

var Invoice = require('./../models/invoice.js');
var Comment = require('./../models/comment.js');

console.log('Running mongoose version %s', mongoose.version);

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 */


//mongoose.connect('mongodb://localhost/terapi', function (err) {
mongoose.connect('mongodb://localhost/terapi', {
	user: 'admin',
	pass: 'desarrollo',
	auth:{authdb:"admin"}
}, function (err) {

	if (err) throw err;
	console.log("Connected");
	getData();
})


function getData() {


var paramTerminal = "TERMINAL4";

var _price = require('../include/price.js');
var _rates = new _price.price(paramTerminal);

var Enumerable = require("linq");

_rates.rates(function (err, rates){

	var req={query:{fechaInicio:"2015-01-19", fechaFin: "2015-01-19"}};


	var param = {
		terminal: paramTerminal,
		codTipoComprob : 1
	}

	var fecha='';
	if (req.query.fechaInicio || req.query.fechaFin){
		param["fecha.emision"]={};
		if (req.query.fechaInicio){
			fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD 00:00:00 Z')).toDate();
			param["fecha.emision"]['$gte'] = fecha;
		}
		if (req.query.fechaFin){
			fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD 00:00:00 Z')).toDate();
			param["fecha.emision"]['$lte'] = fecha;
		}
	}
	if (req.query.razonSocial){
		param.razon = {$regex:req.query.razonSocial}
	}

	var paramTotal = [
		{ $match: param },
		{ $project : {'detalle.items.id': 1, 'detalle.contenedor': 1, _id: 0}},
		{ $unwind: '$detalle' },
		{ $unwind: '$detalle.items' },
		{ $match : {'detalle.items.id' : {$in: rates }}},
		{ $project : {contenedor : '$detalle.contenedor'} }
	];

	var inv = Invoice.aggregate(paramTotal);
	inv.exec(function (err, data1){

		Invoice.distinct('detalle.contenedor', param, function (err, data2){

			var contes = Enumerable.from(data1).select('$.contenedor');
			var contDist = Enumerable.from(data2);

			console.log(data1)
			console.log(data2)

			var dife = contDist.except(contes)
				.orderBy()
				.select(function (item){
					return {contenedor: {contenedor: item}};})
				.toArray();
console.log('Total: %s,NoRates:%j',dife.length,dife);
//			res.send(200, {status: 'OK', totalCount: dife.length, data: dife});
			process.exit(0);
		});

	});
});
}