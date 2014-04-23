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

		if (req.query.inicio || req.query.fin){
			param.$or=[];
			if (req.query.inicio){
				 fecha = moment(moment(req.query.inicio).format('YYYY-MM-DD HH:mm Z'));
				param.$or.push({inicio:{$gt: fecha.toString(), $lt:fecha.add('days',1).toString()}});
			}
			if (req.query.fin){
				fecha = moment(moment(req.query.fin).format('YYYY-MM-DD HH:mm Z'));
				param.$or.push({inicio:{$gt: fecha.toString(), $lt:fecha.add('days',1).toString()}});
			}
		}

		Appointment.find(param).exec( function( err, gates){
			if (err){
				console.log("%s - Error: %s", dateTime.getDatetime(), err.error);
				res.send(500 , {status: "ERROR", data: err});
			} else {
				res.send(200, {status:"OK", data: gates});
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
					appointment.insert(appointment2insert, function (errData, data){
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


	app.get('/appointments', getAppointments);
	app.post('/appointment', addAppointment);
}