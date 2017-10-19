/**
 * Created by diego on 20/07/17.
 */
"use strict";

var options,
    reqGet;

var https = require("https");

options = {
    host: 'consultapme.cnrt.gob.ar',
    port : 443,
    //path : '/api/vehiculo_cargas_habilitados/FVO243/pais/AR', //SI TIENE
    path : '/api/vehiculo_cargas_habilitados/BDM361/pais/AR',
    method : 'GET',
    headers : {'Content-Type': 'application/json'}
};

reqGet = https.request(options, res => {
    var resData = '';
    res.on('data', d => {
        resData += d;
    });

    res.on('error', (err) => {
        console.error('ERROR RESPONSE NO_ASOCIADOS - NO mail a %s. %s');
    });

    res.on('end', () => {
        var result = JSON.parse(resData);

        console.log(JSON.stringify(result));
    });
});

reqGet.end(); // ejecuta el request

/*
 var https2 = require('https');

 https2.get('https://consultapme.cnrt.gob.ar/', function(res) {
 console.log('statusCode: ', res.statusCode);

 res.on('data', function(d) {
 process.stdout.write(d);
 });
 });
 */