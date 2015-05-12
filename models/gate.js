/**
 * Created by Diego Reyes on 3/21/14.
 */
var mongoose = require('mongoose');

var gate = new mongoose.Schema({
	terminal:	{type: String},
	buque:			{type: String},
	viaje:			{type: String},
	contenedor:		{type: String},
	mov:			{type: String, enum:['IMPO', 'EXPO', 'PASO']},
	tipo:			{type: String, enum:['IN', 'OUT']},
	carga:			{type: String, enum:['NO', 'LL', 'VA']},
	patenteCamion:	{type: String},
	tren:			{type: String},
	gateTimestamp:	{type: Date, required: true},
	turnoInicio:	{type: Date},
	turnoFin:		{type: Date}
});

gate.index({
	terminal : 1,
	buque : 1,
	viaje : 1,
	contenedor : 1,
	mov : 1,
	gateTimestamp : 1
}, {unique:true});

gate.statics.insert = function(gate, cb){
	if (gate!==undefined){
		this.create(gate, function(err, data){
			if (!err){
				return cb(false, data);
			} else {
				return cb(err);
			}
		})
	}
}

module.exports = mongoose.model('gates', gate);
