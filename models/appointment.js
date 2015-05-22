/**
 * Created by Diego Reyes on 3/21/14.
 */
var mongoose = require('mongoose');

var appointment = new mongoose.Schema({
        terminal: {type: String, require: true},
        buque: {type: String},
        viaje: {type: String},
        contenedor: {type: String},
        inicio: {type: Date, require: true},
        fin: {type: Date},
        mov: {type: String, enum: ['IMPO', 'EXPO']},
        alta: {type: Date},
        user: {type: String, uppercase: true},
        disponibles_t1: {type: Number},
        email: {type: String},
        verifica: {type: Date},
        verifica_turno: {type: String, enum: ['MA', 'TA']},
        verifica_tipo: {type: String, enum: ['PISO', 'CAMION']}
    });

appointment.statics.insert = function (appointment, cb) {
    'use strict';
    if (appointment !== undefined) {
        this.create(appointment, function (err, data) {
            if (!err) {
                return cb(false, data);
            } else {
                return cb(err);
            }
        });
    }
}

module.exports = mongoose.model('appointments', appointment);
