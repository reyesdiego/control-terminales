/**
 * Created by diego on 01/06/17.
 */
"use strict";

var notificador = require("../include/notificador.js");
notificador.login("dreyes@puertobuenosaires.gob.ar", "123456")
    .then(data => {
        console.log(data.data.token);

        notificador.notificaAddPrice(data.data.token, {date: "2017-05-04",description: "T12Q - HOLA TARIFA NUEVA - 25.45 U$S - BACTSSA - bactssa "})
        .then(data => {
                console.log("OK %s", data);
            })
        .catch(err => {
                console.error("PALMO %", err);
            });

    })
    .catch(err => {
        console.error(err);
    });


