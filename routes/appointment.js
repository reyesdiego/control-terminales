/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app) {

	var dateTime = require('../include/moment.js');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var appointment = require('../models/appointment.js');


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


	app.post('/appointment', addAppointment);
}