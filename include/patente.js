/**
 * Created by diego on 06/06/17.
 */
"use strict";

let patente = (patente) => {

    patente = (patente || "").toUpperCase();

    /** Mercosur */
    var AR = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    var BR = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    var VE = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    var UR = /^[A-Z]{3}[0-9]{4}$/;
    var PY = /^[0-9]{3}[A-Z]{4}$/;

    /** Argentina */
    var AR_OLD = /^[A-Z]{3}[0-9]{3}$/;
    /** Paraguay */
    var PY_OLD = /^[A-Z]{3}[0-9]{3}$/;
    /** Brasil */
    var BR_OLD = /^[A-Z]{3}[0-9]{4}$/;

    return AR.test(patente) ||
            BR.test(patente) ||
            VE.test(patente) ||
            UR.test(patente) ||
            PY.test(patente) ||
            AR_OLD.test(patente) ||
            PY_OLD.test(patente) ||
            BR_OLD.test(patente);
};

module.exports.check = patente;
