/**
 * Created by Diego Reyes on 3/21/14.
 */
var mongoose = require('mongoose');

var appointment = new mongoose.Schema({
        terminal: {type: String, required: true},
        buque: {type: String},
        viaje: {type: String},
        contenedor: {type: String, uppercase: true, required: true},
        inicio: {type: Date, required: true},
        fin: {type: Date},
        mov: {type: String, enum: ['IMPO', 'EXPO']},
        alta: {type: Date},
        shipTrip: {
            altaInicio: {type: Number},
            shipT1: {type: Date},
            altaShipT1: {type: Number}
        },
        user: {type: String, uppercase: true},
        disponibles_t1: {type: Number},
        email: {type: String, lowercase: true},
        emailStatus: {type: Boolean},
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

appointment.pre('save', function (next, done) {
    /*
    var self = this;
    var moment = require("moment"),
        alta,
        inicio,
        shipT1,
        Ships = require('./ship.js');

    if (self.alta !== undefined) {
        alta = moment(moment(self.alta).format("YYYY-MM-DD"), "YYYY-MM-DD");
        inicio = moment(moment(self.inicio).format("YYYY-MM-DD"), "YYYY-MM-DD");
        self.shipTrip.altaInicio = inicio.diff(alta, 'days');
        Ships.aggregate([
            {$match: {terminal: self.terminal, ship: self.buque}},
            {$unwind: '$trips'},
            {$match: {'trips.trip': self.viaje}}], function (err, shipTrips) {
                if (!err) {
                    if (shipTrips.length > 0) {
                        shipT1 = moment(shipTrips[0].trips.date);
                        shipT1 = shipT1.add(5, 'days');
                        self.shipTrip.shipT1 = shipT1;
                        self.shipTrip.altaShipT1 = shipT1.diff(alta, 'days');
                    }
                }
        });
    }
    */
    next();
});

module.exports = mongoose.model('appointments', appointment);
