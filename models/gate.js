/**
 * Created by Diego Reyes on 3/21/14.
 */
var mongoose = require('mongoose');

var gate = new mongoose.Schema({
	terminal:	{type: String},
	buque:			{type: String},
	viaje:			{type: String},
	contenedor:		{type: String},
	mov:			{type: String, enum:['IMPO', 'EXPO']},
	tipo:			{type: String, enum:['IN', 'OUT']},
	patenteCamion:	{type: String},
	gateTimestamp:	{type: Date},
	turnoInicio:	{type: Date},
	turnoFin:		{type: Date}
});

gate.statics.insert = function(gate, cb){
	if (gate!==undefined){
		this.create(gate, function(err){
			if (!err){
				cb(false, gate);
			} else {
				cb(err);
			}
		})
	}
}

module.exports = mongoose.model('gates', gate);
