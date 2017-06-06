/**
 * Created by diego on 06/06/17.
 */
"use strict";

let patente = (patente) => {

    patente = (patente || "").toUpperCase();

    var patronViejo = /^[A-Z]{3}[0-9]{3}$/;
    var patronNuevo = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;

    return patronViejo.test(patente) || patronNuevo.test(patente);

};

module.exports.check = patente;
