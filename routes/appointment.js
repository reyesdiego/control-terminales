/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app) {
	var appointment = require('../models/appointment.js');


	function addAppointment(req, res, next){
		'use static';

		var appointment2insert = req.body;
		if (appointment2insert) {
			appointment.insert(appointment2insert, function (err, data){
				if (!err){
					console.log('Appointment inserted at %s', new Date().toString());
					res.send(data);
				} else {
					res.send({"error": err});
				}
			})
		}
	}


	app.post('/appointment', addAppointment);
}