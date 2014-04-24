/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app) {

	var dateTime = require('../include/moment.js');
	var moment = require('moment');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var Appointment = require('../models/appointment.js');

	function getAppointments(req, res, next){
		'use static';

		var fecha;
		var param = {};

		if (req.query.contenedor)
			param.contenedor = req.query.contenedor;

		if (req.query.fechaInicio || req.query.fechaFin){
			param.$or=[];
			if (req.query.fechaInicio){
				 fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
				param.$or.push({inicio:{$lt: fecha}, fin: {$gt:fecha}});
			}
			if (req.query.fechaFin){
				fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
				param.$or.push({inicio:{$lt: fecha}, fin: {$gt:fecha}});
			}
		}

		var appointment = Appointment.find(param).limit(req.params.limit).skip(req.params.skip);
		appointment.exec( function( err, appointments){
			if (err){
				console.error("%s - Error: %s", dateTime.getDatetime(), err.error);
				res.send(500 , {status: "ERROR", data: err});
			} else {
				Appointment.count({}, function (err, cnt){
					var result = {
						status: 'OK',
						totalCount: cnt,
						pageCount: req.params.limit,
						page: req.params.skip,
						data: appointments
					}
					res.send(200, {status:"OK", data: result});
				});

			}
		})
	}

	function addAppointment(req, res, next){
		'use static';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {

			if (err) {
				console.log("%s - Error: %s", dateTime.getDatetime(), err.error);
				res.send(403, {status:'ERROR', data: err.error});
			} else {
				var appointment2insert = req.body;
				appointment2insert.terminal = usr.terminal;
				if (appointment2insert) {
					Appointment.insert(appointment2insert, function (errData, data){
						if (!errData){
							console.log('%s - Appointment inserted. - %s', dateTime.getDatetime(), usr.terminal);
							res.send(200, {status: 'OK', data: data});
						} else {
							res.send(500, {status:'ERROR', data: errData.toString()});
						}
					})
				}
			}
		});
	}

	app.get('/appointments/:skip/:limit', getAppointments);
	app.post('/appointment', addAppointment);
}