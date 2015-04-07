/**
 * Created by Diego Reyes on 3/21/14.
 */

module.exports = function (log, io, app) {

	var express = require('express');
	var router = express.Router();

	var moment = require('moment');
	var Appointment = require('../models/appointment.js');
	var util = require('util');
	var mail = require("../include/emailjs");
	var config = require('../config/config.js');

	function getAppointments(req, res){
		'use strict';
		var usr = req.usr;

		var fechaIni, fechaFin;
		var param = {};

		var limit = parseInt(req.params.limit, 10);
		var skip = parseInt(req.params.skip, 10);

		if (req.query.contenedor)
			param.contenedor = req.query.contenedor;

		if (req.query.buqueNombre)
			param.buque = req.query.buqueNombre;

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
				res.status(500).send({status: "ERROR", data: err});
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
					res.status(200).send(result);
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
			res.status(200).send(data);
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
			res.status(200).send(data);
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
					var socketMsg = {status:'OK', terminal: usr.terminal};
					io.sockets.emit('appointment', socketMsg);
					res.status(200).send({status: 'OK', data: data});
				} else {
					var errMsg = util.format('%s.-%s- \n%s', errData.toString(), usr.terminal, JSON.stringify(req.body));
					log.logger.error(errMsg);

					var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
					var mailer = new mail.mail(config.email);
					mailer.send(usr.email, strSubject, errMsg, function(){
					});

					res.status(500).send({status:'ERROR', data: errMsg});
				}
			});
		}
	}

	function getDistincts( req, res) {

		var usr = req.usr;
		var distinct = '';

		if (req.route.path === '/:terminal/containers')
			distinct = 'contenedor';

		if (req.route.path === '/:terminal/ships')
			distinct = 'buque';

		var param = {};
		if (usr.role === 'agp')
			param.terminal = req.params.terminal;
		else
			param.terminal = usr.terminal;

		Appointment.distinct(distinct, param, function (err, data){
			if (err){
				res.status(500).send({status: 'ERROR', data: err});
			} else {
				res.status(200).send({status: 'OK', totalCount: data.length, data: data.sort()});
			}
		});
	}

	function isValidToken (req, res, next){

		var Account = require('../models/account.js');

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(err);
				res.status(500).send({status:'ERROR', data: err});
			} else {
				req.usr = usr;
				next();
			}
		});
	}

/*
	router.use(function timeLog(req, res, next){
		log.logger.info('Time: %s', Date.now());
		next();
	});
*/

	router.get('/ByHour', getAppointmentsByHour);
	router.get('/ByMonth', getAppointmentsByMonth);
	router.get('/:terminal/:skip/:limit', getAppointments);
	router.get('/:terminal/containers', getDistincts);
	router.get('/:terminal/ships', getDistincts);
	router.post('/appointment', addAppointment);
	app.post('/appointment', isValidToken, addAppointment);

	return router;
//	app.get('/appointmentsByHour', isValidToken, getAppointmentsByHour);
//	app.get('/appointmentsByMonth', isValidToken, getAppointmentsByMonth);
//	app.get('/appointments/:terminal/:skip/:limit', isValidToken, getAppointments);
//	app.get('/appointments/:terminal/containers', isValidToken, getDistincts);
//	app.get('/appointments/:terminal/ships', isValidToken, getDistincts);
//	app.post('/appointment', isValidToken, addAppointment);
};