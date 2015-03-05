/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app, io, log) {

	var dateTime = require('../include/moment.js');
	var moment = require('moment');
	var Appointment = require('../models/appointment.js');
	var util = require('util');
	var mail = require("../include/emailjs");
	var config = require('../config/config.js');

	function isValidToken (req, res, next){

		var Account = require('../models/account.js');

		var incomingToken = req.headers.token;
		var paramTerminal = req.params.terminal;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(err);
				res.send(500, {status:'ERROR', data: err});
			} else {

				if (paramTerminal !== undefined && usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					req.usr = usr;
					next();
				}
			}
		});
	}

	function getAppointments(req, res){
		'use strict';
		var usr = req.usr;

		var fechaIni, fechaFin;
		var param = {};

		var limit = parseInt(req.params.limit, 10);
		var skip = parseInt(req.params.skip, 10);

		if (req.query.contenedor)
			param.contenedor = req.query.contenedor;

		if (req.query.buque)
			param.buque = req.query.buque;

		if (req.query.viaje)
			param.viaje = req.query.viaje;

		if (req.query.fechaInicio && req.query.fechaFin){
			param.$or=[];
			fechaIni = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
			param.$or.push({inicio:{$lte: fechaIni}, fin: {$gte: fechaIni}});
			fechaFin = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
			param.$or.push({inicio:{$lte: fechaFin}, fin: {$gte: fechaFin}});
			param.$or.push({inicio:{$gte: fechaIni}, fin: {$lte: fechaFin}});
		}

		if (usr.role === 'agp')
			param.terminal= req.params.terminal;
		else
			param.terminal= usr.terminal;

		var appointment = Appointment.find(param).limit(limit).skip(skip);
		appointment.exec( function( err, appointments){
			if (err){
				log.logger.error("Error: %s", err.error);
				res.send(500 , {status: "ERROR", data: err});
			} else {
				Appointment.count(param, function (err, cnt){
					var pageCount = appointments.length;
					var result = {
						status: 'OK',
						totalCount: cnt,
						pageCount: (limit > pageCount) ? limit : pageCount,
						page: skip,
						data: appointments
					}
					res.send(200, result);
				});
			}
		});
	}

	function getAppointmentsByHour(req, res){
		'use strict';
		var usr = req.usr;

		var date = moment(moment().format('YYYY-MM-DD')).toDate();
		if (req.query.fecha !== undefined){
			date = moment(moment(req.query.fecha).format('YYYY-MM-DD')).toDate();
		}
		var tomorrow = moment(date).add('days',1).toDate();

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

	function getAppointmentsByMonth(req, res){
		'use strict';

		var date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date()-1);
		if (req.query.fecha !== undefined){
			date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date()-1);
		}
		var month5Ago = moment(date).subtract('months',4).toDate();
		var nextMonth = moment(date).add('months',1).toDate();

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

	function addAppointment(req, res){
		'use strict';
		var usr = req.usr;

		var appointment2insert = req.body;
		appointment2insert.inicio = moment(appointment2insert.inicio);
		appointment2insert.fin = moment(appointment2insert.fin);
		appointment2insert.terminal = usr.terminal;

		if (appointment2insert) {
			Appointment.insert(appointment2insert, function (errData, data){
				if (!errData){
					var str = util.format('Appointment INS: %s - %s - Inicio: %s, Fin: %s', data._id, usr.terminal, data.inicio, data.fin);
					log.logger.insert(str);
					var socketMsg = {status:'OK', datetime: dateTime.getDatetime(), terminal: usr.terminal};
					io.sockets.emit('appointment', socketMsg);
					res.send(200, {status: 'OK', data: data});
				} else {
					var errMsg = util.format('%s - ERROR: %s.-%s- \n%s', dateTime.getDatetime(), errData.toString(), usr.terminal, JSON.stringify(req.body));
					log.logger.error(errMsg);

					var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
					var mailer = new mail.mail(config.email);
					mailer.send(usr.email, strSubject, errMsg, function(){
					});

					res.send(500, {status:'ERROR', data: errMsg});
				}
			});
		}
	}

	function getDistincts( req, res) {

		var usr = req.usr;
		var distinct = '';

		if (req.route.path === '/appointments/:terminal/containers')
			distinct = 'contenedor';

		if (req.route.path === '/appointments/:terminal/ships')
			distinct = 'buque';

		var param = {};
		if (usr.role === 'agp')
			param.terminal = req.params.terminal;
		else
			param.terminal = usr.terminal;

		Appointment.distinct(distinct, param, function (err, data){
			if (err){
				res.send(500, {status: 'ERROR', data: err});
			} else {
				res.send(200, {status: 'OK', totalCount: data.length, data: data.sort()});
			}
		});
	}

	app.get('/appointmentsByHour', isValidToken, getAppointmentsByHour);
	app.get('/appointmentsByMonth', isValidToken, getAppointmentsByMonth);
	app.get('/appointments/:terminal/:skip/:limit', isValidToken, getAppointments);
	app.get('/appointments/:terminal/containers', isValidToken, getDistincts);
	app.get('/appointments/:terminal/ships', isValidToken, getDistincts);
	app.post('/appointment', isValidToken, addAppointment);
};