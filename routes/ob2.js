/**
 * Created by diego on 14/08/17.
 */
"use strict";

module.exports = (log) => {

    var express = require('express'),
        router = express.Router();

    let getDates = (req, res) => {


        var options,
            reqGet;

        var http = require("http");
        options = {
            host: 'www.e-puertobue.com.ar',
            port : 80,
            path : `/ws/ws-sitios.php`,
            method : 'GET'
        };

        reqGet = http.request(options, response => {
            var resData = '';
            response.on('data', d => {
                resData += d;
            });

            response.on('error', (err) => {
                console.error('ERROR RESPONSE OB2 %s', err);
                res.status(500).send({
                    status:'ERROR',
                    message: err
                });
            });

            response.on('end', () => {
                res.status(200).send({
                    status: 'OK',
                    data: {
                        buque: req.params.buque,
                        arribo: '2017-08-20T10:00:00Z',
                        inicioOperaciones: '2017-08-20T13:00:00Z',
                        finOperaciones: '2017-08-20T21:00:00Z',
                        partida: '2017-08-20T23:00:00Z'}
                });
            });
        });
        reqGet.end(); // ejecuta el request

    };

    router.get('/dates/:buque', getDates);

    return router;
};
