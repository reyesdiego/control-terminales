/**
 * Created by diego on 21/06/16.
 */

var mongoose = require("mongoose");

var eBueShip = new mongoose.Schema({
    _id: {type: Number, required: true},
    terminal: {type: String, required: true, enum: ['BACTSSA', 'TERMINAL4', 'TRP']},
    buque: {type: String, required: true},
    viaje: {type: String, required: true},
    entradaVanguardia: {type: Date},
    amarre: {type: Date},
    inicioOperaciones: {type: Date},
    finOperaciones: {type: Date},
    zarpada: {type: Date},
    salidaVanguardia: {type: Date}
});

module.exports = mongoose.model('ebueships', eBueShip);
