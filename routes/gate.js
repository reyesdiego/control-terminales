/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app, io) {

	var dateTime = require('../include/moment');
	var moment = require('moment');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var Gate = require('../models/gate.js');

	function getGates(req, res, next){
		'use static';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {
				var fecha;
				var param = {};

				if (req.query.contenedor)
					param.contenedor = req.query.contenedor;

				if (req.query.fechaInicio || req.query.fechaFin){
					param.gateTimestamp={};
					if (req.query.fechaInicio){
						fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
						param.gateTimestamp['$gte'] = fecha;
					}
					if (req.query.fechaFin){
						fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
						param.gateTimestamp['$lt'] = fecha;
					}
				}
				param.terminal= usr.terminal;

				var gate = Gate.find(param).limit(req.params.limit).skip(req.params.skip).sort({gateTimestamp:1});
				gate.exec( function( err, gates){
					if (err){
						console.log("%s - Error: %s", dateTime.getDatetime(), err.error);
						res.send(500 , {status: "ERROR", data: err});
					} else {
						Gate.count(param, function (err, cnt){
							var result = {
								status: 'OK',
								totalCount: cnt,
								pageCount: (req.params.limit > cnt)?cnt:req.params.limit,
								page: req.params.skip,
								data: gates
							}
							res.send(200, result);
						});
					}
				})
			}
		});

	}

	function addGate(req, res, next){
		'use static';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err) {
				console.log("%s - Error: %s", dateTime.getDatetime(), err.error);
				res.send(403, {status:"ERROR", data: err.error});
			} else {
				var gate2insert = req.body;
				gate2insert.terminal = usr.terminal;
				if (gate2insert) {
					Gate.insert(gate2insert, function (errSave, data) {
						if (!errSave){
							console.log('%s - Gate INS: %s - %s', dateTime.getDatetime(), data._id, usr.terminal);
							var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
							io.sockets.emit('gate', socketMsg);
							res.send(200, {status: "OK", data: data});
						} else {
							res.send(500, {status:"ERROR", data: errSave});
						}
					});
				}
			}
		});
	}

	app.get('/gates/:skip/:limit', getGates);
	app.post('/gate', addGate);
}