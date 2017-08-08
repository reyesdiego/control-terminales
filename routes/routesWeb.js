/**
 * Created by diego on 3/9/15.
 */

module.exports = function (log, app, io, oracle, params) {
    'use strict';
    var serverMain,
        state,
        match,
        mat,
        paying,
        price,
        comment,
        appointment,
        appointmentEmailQueue,
        docType,
        unitType,
        task,
        voucherType,
        gate,
        invoice,
        moment = require('moment');

    function isValidToken(req, res, next) {

        var Account = require('../models/account.js'),
            incomingToken = req.headers.token;

        Account.verifyToken(incomingToken, (err, usr) => {
            if (err) {
                log.logger.error(err);
                res.status(403).send({status: 'ERROR', data: err});
            } else {
                req.usr = usr;
                next();
            }
        });
    }

    serverMain = require('./server')(log, params);
    app.use('/', serverMain);

    appointment = require('./appointment')(log);
    app.use('/appointments', isValidToken, appointment);

    appointmentEmailQueue = require('./appointmentEmailQueue')(log);
    app.use('/appointmentEmailQueues', isValidToken, appointmentEmailQueue);

    comment = require('./comment')(log, oracle);
    app.use('/comments', isValidToken, comment);

    docType = require('./docType')(log);
    app.use('/docTypes', docType);

    gate = require('./gate')(log, oracle);
    app.use('/gates', isValidToken, gate);

    invoice = require('./invoice')(log, io, oracle);
    app.use('/invoices', isValidToken, invoice);

    mat = require('./mat')(log);
    app.use('/mats', isValidToken, mat);

    match = require('./matchPrice')(log, oracle);
    app.use('/matchPrices', isValidToken, match);

    paying = require('./paying')(log, oracle);
    app.use('/paying', isValidToken, paying);

    price = require('./price')(log, oracle);
    app.use('/prices', isValidToken, price);

    state = require('./state')(log);
    app.use('/states', state);

    task = require('./task')(log);
    app.use('/tasks', isValidToken, task);

    unitType = require('./unitType')(log);
    app.use('/unitTypes', unitType);

    voucherType = require('./voucherType')(log, oracle);
    app.use('/voucherTypes', isValidToken, voucherType);

    app.post('/sendMail', isValidToken, function (req, res) {

        var config = require("../config/config.js");
        var mail = require("../include/emailjs");

        var param = req.body;
        var html = {
            data : param.html,
            alternative: true
        }

        mail = new mail.mail(config.email);

        mail.send(param.to, param.subject, html, function (err, data) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    });

    app.get('/containerTurno/:container', (req, res) => {
        var Appointment = require('../models/appointment.js');
        var param = {};

        param.contenedor = req.params.container.toUpperCase();
        param.inicio = {$gte: moment(moment().format("YYYY-MM-DD")).toDate()};
        param['status.status'] = {$ne: 9};

        Appointment
            .find(param)
            .sort({_id: -1})
            .lean()
            .exec((err, data) => {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {

                    var options,
                        reqGet;
                    var https = require("https");

                    if (data.transporte) {
                        if (data.transporte.camion !== undefined) {
                            options = {
                                host: 'consultapme.cnrt.gob.ar',
                                port : 443,
                                path : `/api/vehiculo_cargas_habilitados/${data.transporte.camion.toUpperCase()}/pais/AR`,
                                method : 'GET',
                                headers : {'Content-Type': 'application/json'}
                            };

                            reqGet = https.request(options, res => {
                                var resData = '';
                                res.on('data', d => {
                                    resData += d;
                                });

                                res.on('error', (err) => {
                                    console.error('ERROR RESPONSE CNRT %s', err);
                                });

                                res.on('end', () => {
                                    var result = JSON.parse(resData);
                                    console.log(result);
                                    if (result && result.length > 0) {
                                        console.log(result[0]);
                                        io.sockets.emit('cnrt', result[0]);
                                    } else if (result.code === 404) {
                                        console.log(result[0]);
                                        io.sockets.emit('cnrt', result[0]);
                                    }
                                });
                            });
                            reqGet.end(); // ejecuta el request
                        }
                    }

                    res.status(200).send({status: 'OK', data: data || []});
                }
            });
    });

    app.get('/camionTurno/:camion', (req, res) => {
        var Appointment = require('../models/appointment.js');
        var param = {};
        var async = require("async");

        param['transporte.camion'] = req.params.camion.toUpperCase();
        param.inicio = {$gte: moment(moment().format("YYYY-MM-DD")).toDate()};

        param['status.status'] = {$ne: 9};
        Appointment
            .find(param)
            .sort({_id: -1})
            .lean()
            .exec((err, data) => {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {

                    if (data.length > 0) {
                        var options,
                            reqGet;

                        var https = require("https");
                        options = {
                            host: 'consultapme.cnrt.gob.ar',
                            port : 443,
                            path : `/api/vehiculo_cargas_habilitados/${req.params.camion.toUpperCase()}/pais/AR`,
                            method : 'GET',
                            headers : {'Content-Type': 'application/json'}
                        };

                        reqGet = https.request(options, res => {
                            var resData = '';
                            res.on('data', d => {
                                resData += d;
                            });

                            res.on('error', (err) => {
                                console.error('ERROR RESPONSE CNRT %s', err);
                            });

                            res.on('end', () => {
                                var result = JSON.parse(resData);
                                console.log(result);
                                if (result && result.length > 0) {
                                    console.log(result[0]);
                                    io.sockets.emit('cnrt', result[0]);
                                } else if (result.code === 404) {
                                    console.log(result[0]);
                                    io.sockets.emit('cnrt', result[0]);
                                }
                            });
                        });
                        reqGet.end(); // ejecuta el request
                    }

                    res.status(200).send({status: 'OK', data: data || []});
                }
            });
    });

    app.get('/containerTurnoList', (req, res) => {
        var Appointment = require('../models/appointment.js');
        var param = {};

        param.inicio = {$gte: moment(moment().format("YYYY-MM-DD")).toDate()};
        param['status.status'] = {$ne: 9};

        Appointment.distinct('contenedor', param)
            .exec((err, data) => {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    res.status(200).send({status: 'OK', totalCount: data.length, data: data || []});
                }
            });
    });

    app.get('/camionTurnoList', (req, res) => {
        var Appointment = require('../models/appointment.js');
        var param = {};

        param.inicio = {$gte: moment(moment().format("YYYY-MM-DD")).toDate()};
        param['status.status'] = {$ne: 9};

        Appointment.distinct('transporte.camion', param)
            .exec((err, data) => {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    res.status(200).send({status: 'OK', totalCount: data.length, data: data || []});
                }
            });
    });

};