/**
 * Created by diego on 17/08/16.
 */
'use strict';

module.exports = function(peso) {
    var Promise = require('es6-promise').Promise;
    var http = require('http');

    Promise = new Promise((resolve, reject) => {

        var optionsget = {
            host: '10.10.0.223', // here only the domain name (no http/https !)
            port: 8090,
            path: '/sendMail',
            method: 'POST',
            timeout: 20,
            headers: {
                token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im5vcmVwbHlAcHVlcnRvYnVlbm9zYWlyZXMuZ29iLmFyIn0.g4d2NfkU5vIYfkG2QuEsKpTiT_-jpYLK5QGriiKa4Ck",
                'Content-Type': 'application/json'
            }
        };

        var reqGet = http.request(optionsget, (res) => {

            if (res.statusCode === 200) {
                resolve("OK");
            } else {
                console.log("Se Cayo: ", res.statusCode);
                reject("ERROR");
            }
            var chunk1;
            res.on('data', function (chunk) {
                chunk1 += chunk;
            });
            res.on('end', function () {
                console.log('termino');
            });
        });

        reqGet.write(JSON.stringify({"to": "reyesdiego@hotmail.com", "html": `<p>hello ${peso}</p>`}));
        reqGet.on('error', function (e) {
            reject("ERROR %s", e);
        });

        reqGet.end();

    });

    return Promise;
};