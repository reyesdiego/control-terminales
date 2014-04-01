/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app) {

	var moment = require('moment');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var appointment = require('../models/appointment.js');


	function addAppointment(req, res, next){
		'use static';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {

			if (err) {
				console.log("%s - Error: %s", moment().format('YYYY-MM-DD HH:MM:SS'), err.error);
				res.send(403);
			} else {
				var appointment2insert = req.body;
				appointment2insert.terminal = usr.terminal;
				if (appointment2insert) {
					appointment.insert(appointment2insert, function (err, data){
						if (!err){
							console.log('%s - Appointment inserted.', moment().format('YYYY-MM-DD HH:MM'));
							res.send(data);
						} else {
							res.send({"error": err});
						}
					})
				}
			}
		});
	}


	app.post('/appointment', addAppointment);
}