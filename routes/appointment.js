/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app, io) {

	var dateTime = require('../include/moment.js');
	var moment = require('moment');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var Appointment = require('../models/appointment.js');

	function getAppointments(req, res, next){
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
					param.$or=[];
					if (req.query.fechaInicio){
						fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
						param.$or.push({inicio:{$lte: fecha}, fin: {$gte:fecha}});
					}
					if (req.query.fechaFin){
						fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
						param.$or.push({inicio:{$lte: fecha}, fin: {$gte:fecha}});
					}
				}

				if (usr.role === 'agp')
					param.terminal= req.params.terminal;
				else
					param.terminal= usr.terminal;

				var appointment = Appointment.find(param).limit(req.params.limit).skip(req.params.skip);
				appointment.exec( function( err, appointments){
					if (err){
						console.error("%s - Error: %s", dateTime.getDatetime(), err.error);
						res.send(500 , {status: "ERROR", data: err});
					} else {
						Appointment.count(param, function (err, cnt){
							var result = {
								status: 'OK',
								totalCount: cnt,
								pageCount: (req.params.limit > cnt)?cnt:req.params.limit,
								page: req.params.skip,
								data: appointments
							}
							res.send(200, result);
						});
					}
				});
			}

		});
	}

	function getAppointmentsByHour(req, res){
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
				var fecha;
				var param = {};


				param.terminal= usr.terminal;

				var jsonParam = [
					{$match: { 'inicio': {$gte: date, $lt: tomorrow} }},
					{ $project: {'accessDate':'$inicio', terminal: '$terminal'} },
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

				Appointment.aggregate(jsonParam, function (err, data){
					res.send(200, data);
				});

			}
		});
	}

	function getAppointmentsByMonth(req, res){
		'use static';

		var moment = require('moment');

		var date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date()-1);
		if (req.query.fecha !== undefined){
			date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date()-1);
		}
		var month5Ago = moment(date).subtract('months',4).toDate();
		var nextMonth = moment(date).add('months',1).toDate();

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error(usr);
				res.send(500, {status:'ERROR', data: err});
			} else {

//				param.terminal= usr.terminal;

				var jsonParam = [
					{$match: { 'inicio': {$gte: month5Ago, $lt: nextMonth} }},
					{ $project: {'accessDate':'$inicio', terminal: '$terminal'} },
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

				Appointment.aggregate(jsonParam, function (err, data){
					res.send(200, data);
				});

			}
		});
	}

	function addAppointment(req, res){
		'use static';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {

			if (err) {
				console.log("%s - Error: %s", dateTime.getDatetime(), err.error);
				res.send(403, {status:'ERROR', data: err.error});
			} else {
				var appointment2insert = req.body;
				appointment2insert.inicio = moment(appointment2insert.inicio);
				appointment2insert.fin = moment(appointment2insert.fin);
				appointment2insert.terminal = usr.terminal;

				if (appointment2insert) {
					Appointment.insert(appointment2insert, function (errData, data){
						if (!errData){
							console.log('%s - Appointment INS: %s - %s - Inicio: %s, Fin: %s', dateTime.getDatetime(), data._id, usr.terminal, data.inicio, data.fin);
							var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
							io.sockets.emit('appointment', socketMsg);
							res.send(200, {status: 'OK', data: data});
						} else {
							console.error('%s - ERROR: %s', dateTime.getDatetime(), errData.toString());
							res.send(500, {status:'ERROR', data: errData.toString()});
						}
					});
				}
			}
		});
	}

	app.get('/appointmentsByHour', getAppointmentsByHour);
	app.get('/appointmentsByMonth', getAppointmentsByMonth);
	app.get('/appointments/:terminal/:skip/:limit', getAppointments);
	app.post('/appointment', addAppointment);
};