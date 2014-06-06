/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app, io) {

	var dateTime = require('../include/moment');
	var moment = require('moment');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var Gate = require('../models/gate.js');

	function getGates(req, res){
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
							};
							res.send(200, result);
						});
					}
				})
			}
		});

	}

	function getGatesByHour(req, res){
		'use static';

		var moment = require('moment');
		var date = moment(moment().format('YYYY-MM-DD')).toDate();
		if (req.query.fecha !== undefined){
			date = moment(moment(req.query.fecha).format('YYYY-MM-DD')).toDate();
		}
		var tomorrow = moment(date).add('days',1).toDate();

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {

//				param.terminal= usr.terminal;

				var jsonParam = [
					{$match: { 'gateTimestamp': {$gt: date, $lt: tomorrow} }},
					{ $project: {'accessDate':'$gateTimestamp', terminal: '$terminal'} },
					{ $group : {
						_id : { terminal: '$terminal',
							year: { $year : "$accessDate" },
							month: { $month : "$accessDate" },
							day: { $dayOfMonth : "$accessDate" },
							hour: { $hour : "$accessDate" }
						},
						cnt : { $sum : 1 }
					}
					},
					{ $sort: {'_id.hour': 1, '_id.terminal': 1 }}
				];

				Gate.aggregate(jsonParam, function (err, data){
					res.send(200, data);
				});
			}
		});
	}

	function getGatesByMonth (req, res) {
		'use static';
		var moment = require('moment');

		var date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date()-1);
		if (req.query.fecha !== undefined){
			date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date()-1);
		}
		var month5Ago = moment(date).subtract('months',5).toDate();
		var nextMonth = moment(date).add('months',1).toDate();

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {

//				param.terminal= usr.terminal;

				var jsonParam = [
					{$match: { 'gateTimestamp': {$gt: month5Ago, $lt: nextMonth} }},
					{ $project: {'accessDate':'$gateTimestamp', terminal: '$terminal'} },
					{ $group : {
						_id : { terminal: '$terminal',
							year: { $year : "$accessDate" },
							month: { $month : "$accessDate" }
						},
						cnt : { $sum : 1 }
					}
					},
					{ $sort: {'_id.month': 1, '_id.terminal': 1 }}
				];

				Gate.aggregate(jsonParam, function (err, data){
					res.send(200, data);
				});
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

				gate2insert.gateTimestamp = moment(gate2insert.gateTimestamp);
				gate2insert.turnoInicio = moment(gate2insert.turnoInicio);
				gate2insert.turnoFin = moment(gate2insert.turnoFin);
				gate2insert.terminal = usr.terminal;

				if (gate2insert) {
					Gate.insert(gate2insert, function (errSave, data) {
						if (!errSave){
							console.log('%s - Gate INS: %s - %s - %s', dateTime.getDatetime(), data._id, usr.terminal, gate2insert.gateTimestamp);
							var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
							io.sockets.emit('gate', socketMsg);
							res.send(200, {status: "OK", data: data});
						} else {
							console.log("%s - Error: %s. - %s", dateTime.getDatetime(), errSave, usr.terminal);
							res.send(500, {status:"ERROR", data: errSave});
						}
					});
				}
			}
		});
	}

	app.get('/gatesByHour', getGatesByHour);
	app.get('/gatesByMonth', getGatesByMonth);
	app.get('/gates/:skip/:limit', getGates);
	app.post('/gate', addGate);
};