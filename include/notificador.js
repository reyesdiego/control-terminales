/**
 * Created by diego on 01/06/17.
 */
"use strict";

var config = require("../config/config.js");

var login = (user, pass) => {
    return new Promise((resolve, reject) => {
        var http = require("http");
        var options = {
            host : config.notificador.host, // here only the domain name (no http/https !)
            port : config.notificador.port,
            path : '/login',
            method : 'POST',
            headers : {"Content-Type": "application/json"}
        };

        var req = http.request(options, res => {
            var str = '';
            res.on('data', chunk => {
                str += chunk;
            });
            res.on('error', (err) => {
                reject({
                    status: "ERROR",
                    message: err.message,
                    data: err
                });
            });
            res.on('end', () => {
                var response = JSON.parse(str);
                if (response.status === 'OK') {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        });
        req.write(JSON.stringify({
            email: user,
            password: pass
        }));

        req.on('error', (err) => {
            reject({
                status: err.code,
                data: err
            });
            req.end();
        });

        req.end();

    });
};
module.exports.login = login;

var notificaAddPrice = (token, price) => {
    return new Promise((resolve, reject) => {

        var http = require("http");
        var options = {
            host : config.notificador.host, // here only the domain name (no http/https !)
            port : config.notificador.port,
            path : '/incomings/incoming/CTNT',
            method : 'POST',
            headers : {
                "Content-Type": "application/json",
                "token": token
            }
        };

        var req = http.request(options, res => {

            var str = '';
            res.on('data', chunk => {
                str += chunk;
            });
            res.on('error', (err) => {
                reject({
                    status: "ERROR",
                    message: err.message,
                    data: err
                });
            });
            res.on('end', () => {
                var response = JSON.parse(str);
                if (response.status === 'OK') {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        });

        req.write(JSON.stringify({
            message: [{date: price.date, description: price.description}]}));

        req.end();

        req.on('error', (err) => {
            reject({
                status: "ERROR",
                message: err.message,
                data: err
            });
            req.end();
        });
    });
};
module.exports.notificaAddPrice = notificaAddPrice;

var notificaAddPriceMatch = (token, price) => {
    return new Promise((resolve, reject) => {

        var http = require("http");
        var options = {
            host : config.notificador.host, // here only the domain name (no http/https !)
            port : config.notificador.port,
            path : '/incomings/incoming/CTAMATCH',
            method : 'POST',
            headers : {
                "Content-Type": "application/json",
                "token": token
            }
        };

        var req = http.request(options, res => {

            var str = '';
            res.on('data', chunk => {
                str += chunk;
            });
            res.on('error', (err) => {
                reject({
                    status: "ERROR",
                    message: err.message,
                    data: err
                });
            });
            res.on('end', () => {
                var response = JSON.parse(str);
                if (response.status === 'OK') {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        });

        req.write(JSON.stringify({
            message: [{date: price.date, description: price.description}]}));

        req.end();

        req.on('error', (err) => {
            reject({
                status: "ERROR",
                message: err.message,
                data: err
            });
            req.end();
        });
    });
};
module.exports.notificaAddPriceMatch = notificaAddPriceMatch;

