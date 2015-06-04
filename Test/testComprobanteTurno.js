/**
 * Created by diego on 6/4/15.
 */

var express = require('express');
var app = express();
var http = require('http');

app.set('views', '/home/diego/agp/agpapi/public');
app.set('view engine', 'jade');

app.locals.moment = require('moment');

var server = http.createServer(app);

server.listen(3333, function () {
   console.log("Process Id (pid): %s", process.pid);
});

app.get('/kk', function (req, res) {
    'use strict';

    var moment = require("moment"),
        param = {
            "buque": "SE LA BANCO",
            "viaje": "x1",
            "contenedor": "CAXU1234567",
            "inicio": moment("2015-05-20T20:00:00.000Z"),
            "mov": "EXPO",
            "email": "reyesdiego@hotmail.com",
            "full_name": "B.A.C.T.S.S.A. (Terminal 5)",
            "alta": moment("2015-05-20T20:00:00.000Z"),
            "disponibles_t1": 14,
            "verifica": "",//moment("2015-05-20T20:00:00.000Z").format("DD-MM-YYYY"),
            "verifica_turno": "MA",
            "verifica_tipo": "PISO"
        };
    res.render('comprobanteTurno', param);

});

