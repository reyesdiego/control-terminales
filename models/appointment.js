/**
 * Created by Diego Reyes on 3/21/14.
 */
var mongoose = require('mongoose');

var appointment = new mongoose.Schema({
		terminal:		{type: String},
		buque:			{type: String},
		viaje:			{type: String},
		contenedor:		{type: String},
		inicio:			{type: Date},
		fin:			{type: Date},
		mov:			{type: String, enum:['IMPO', 'EXPO']},
		alta:			{type: Date},
		user:			{type: String},
		disponibles_t1:	{type: Number}
});

appointment.statics.insert = function(appointment, cb){
	if (appointment!==undefined){
		this.create(appointment, function(err, data){
			if (!err){
				cb(false, data);
			} else {
				cb(err);
			}
		})
	}
}

module.exports = mongoose.model('appointments', appointment);
