/**
 * Created by Diego Reyes on 3/21/14.
 */
"use strict";

var mongoose = require('mongoose');

var appointment = new mongoose.Schema({
    terminal: {type: String, required: true},
    buque: {type: String},
    viaje: {type: String},
    contenedor: {type: String, uppercase: true},
    transporte: {
        camion: {type: String, uppercase: true},
        semi: {type: String, uppercase: true},
        dni: {type: Number},
        celular: {type: Number},
        date: {type: Date, default: new Date()}
    },
    inicio: {type: Date, required: true},
    fin: {type: Date},
    mov: {type: String, enum: ['IMPO', 'EXPO', 'VACIO_OUT', 'VACIO_IN']},
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

appointment.pre('save', function (next, done) {

    var moment = require("moment");

    var fecha = moment().format("YYYY-MM-DD HH:mm:ssZ");
    var inicio = moment(this.inicio).format("YYYY-MM-DD HH:mm:ss");
    var fin = moment(this.fin).format("YYYY-MM-DD HH:mm:ss");
    var verifica = moment(this.verifica).format("YYYY-MM-DD HH:mm:ss");

    if (this.inicio > this.fin) {
        next(new Error(`La Fecha de Inicio del Turno "${inicio}" es Mayor a la de Fin "${fin}"`));
    } else if (this.verifica !== undefined && this.verifica > this.fin) {
        next(new Error(`La Fecha de Verificacion del Turno "${verifica}" es Mayor a la Fecha de Retiro del Contenedor "${fin}"`));
    } else {
        next();
    }
});


//appointment.pre('save', function (next, done) {
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
//    next();
//});

module.exports = mongoose.model('appointments', appointment);
