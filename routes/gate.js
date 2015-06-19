/**
 * Created by Diego Reyes on 3/21/14.
 */

module.exports = function (log, io, app) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        dateTime = require('../include/moment'),
        moment = require('moment'),
        Invoice = require('../models/invoice.js'),
        Gate = require('../models/gate.js'),
        util = require('util'),
        mail = require("../include/emailjs"),
        config = require('../config/config.js'),
        linq = require('linq');

    function getGates(req, res) {

        var usr = req.usr,
            fecha,
            param = {},
            limit = parseInt(req.params.limit, 10),
            skip = parseInt(req.params.skip, 10),
            gates,
            order;

        if (req.query.fechaInicio || req.query.fechaFin) {
            param.gateTimestamp = {};
            if (req.query.fechaInicio) {
                fecha = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
                param.gateTimestamp['$gte'] = fecha;
            }
            if (req.query.fechaFin){
                fecha = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
                param.gateTimestamp['$lt'] = fecha;
            }
        }

        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.buqueNombre) {
            param.buque = req.query.buqueNombre;
        }

        if (req.query.viaje) {
            param.viaje = req.query.viaje;
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        gates = Gate.find(param).limit(limit).skip(skip);
        if (req.query.order) {
            order = JSON.parse(req.query.order);
            gates.sort(order[0]);
        } else {
            gates.sort({gateTimestamp: -1});
        }

        gates.exec(function (err, gates) {
            if (err) {
                log.logger.error("%s", err.error);
                res.status(500).send({status: "ERROR", data: err});
            } else {
                Gate.count(param, function (err, cnt) {
                    var pageCount = gates.length,
                        result = {
                            status: 'OK',
                            totalCount: cnt,
                            pageCount: (limit > pageCount) ? limit : pageCount,
                            page: skip,
                            data: gates
                        };
                    res.status(200).send(result);
                });
            }
        });
    }

    function getGatesByHour(req, res){

        var usr = req.usr,
            date = moment(moment().format('YYYY-MM-DD')).toDate(),
            tomorrow,
            jsonParam;

        if (req.query.fecha !== undefined) {
            date = moment(moment(req.query.fecha).format('YYYY-MM-DD')).toDate();
        }
        tomorrow = moment(date).add('days', 1).toDate();

        jsonParam = [
            {$match: { 'gateTimestamp': {$gte: date, $lt: tomorrow} }},
            { $project: {
                gateTimestamp : {$subtract: [ '$gateTimestamp', 60 * 60 * 3000]},
                terminal: '$terminal'
            }},
            { $group : {
                _id : { terminal: '$terminal',
                    year: { $year : "$gateTimestamp" },
                    month: { $month : "$gateTimestamp" },
                    day: { $dayOfMonth : "$gateTimestamp" },
                    hour: { $hour : "$gateTimestamp" }
                    },
                cnt : { $sum : 1 }
            }},
            { $sort: {'_id.hour': 1, '_id.terminal': 1 }}
        ];

        Gate.aggregate(jsonParam, function (err, data) {
            var result = {
                status : 'OK',
                data : data
            };
            res.status(200).send(result);
        });
    }

    function getGatesByMonth(req, res) {
        var usr = req.usr,
            date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date() - 1),
            month5Ago,
            nextMonth,
            jsonParam;

        if (req.query.fecha !== undefined) {
            date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date() - 1);
        }
        month5Ago = moment(date).subtract('months', 4).toDate();
        nextMonth = moment(date).add('months', 1).toDate();

        jsonParam = [
            {$match: { 'gateTimestamp': {$gte: month5Ago, $lt: nextMonth} }},
            { $project : {
                terminal: '$terminal',
                gateTimestamp : {$subtract:[ '$gateTimestamp', 60 * 60 * 3000]}
            }},
            {"$group": {
                _id: {
                    "terminal": "$terminal",
                    "year": {"$year": "$gateTimestamp"},
                    "month": {"$month": "$gateTimestamp"}
                },
                cnt: {"$sum": 1}
            }},
            { $sort: {'_id.month': 1, '_id.terminal': 1 }}
        ];
        Gate.aggregate(jsonParam, function (err, data) {
            var result = {
                status : 'OK',
                data : data
            };
            res.status(200).send(result);
        });
    }

    function getDistincts(req, res) {

        var usr = req.usr,
            distinct = '',
            param = {};

        if (req.route.path === '/:terminal/ships') {
            distinct = 'buque';
        }

        if (req.route.path === '/:terminal/containers') {
            distinct = 'contenedor';
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        Gate.distinct(distinct, param, function (err, data) {
            if (err) {
                res.status(500).send({status: 'ERROR', data: err.message});
            } else {
                res.status(200).send({
                    status: 'OK',
                    totalCount: data.length,
                    data: data.sort()
                });
            }
        });
    }

    function getMissingGates(req, res) {

        var usr = req.usr,
            terminal = '',
            _price,
            _rates,
            order;

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }

        _price = require('../include/price.js');
        _rates = new _price.price();
        _rates.rates(function (err, rates) {

            var invoices = Invoice.aggregate([
                {$match: {terminal: terminal}},
                {$unwind: '$detalle'},
                {$unwind: '$detalle.items'},
                {$match: {'detalle.items.id': {$in: rates}}},
                {$project: {nroPtoVenta: 1, codTipoComprob: 1, nroComprob: 1, contenedor: '$detalle.contenedor', code: '$detalle.items.id', fecha: '$fecha.emision'}}
            ]);

            if (req.query.order) {
                order = JSON.parse(req.query.order);
                invoices.sort(order[0]);
            } else {
                invoices.sort({codTipoComprob: 1, nroComprob: 1});
            }

            invoices.exec(function (err, dataInvoices) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    var gates = Gate.find({terminal: terminal, carga: "LL"}, {contenedor: 1});
                    gates.exec(function (err, dataGates) {
                        if (err) {
                            res.status(500).send({status: 'ERROR', data: err.message});
                        } else {
                            var invoicesWoGates = linq.from(dataInvoices)
                                .except(dataGates, "$.contenedor").toArray();

                            res.status(200)
                                .send({
                                    status: 'OK',
                                    totalCount: invoicesWoGates.length,
                                    data: invoicesWoGates
                                });
                        }
                    });
                }
            });
        });
    }

    function getMissingInvoices(req, res) {

        var usr = req.usr,
            terminal = '',
            _price,
            _rates,
            gates;

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }

        _price = require('../include/price.js');
        _rates = new _price.price();
        _rates.rates(function (err, rates) {

            gates = Gate.find({terminal: terminal, carga: "LL"});
            if (req.query.order) {
                var order = JSON.parse(req.query.order);
                gates.sort(order[0]);
            } else {
                gates.sort({gateTimestamp: 1});
            }
            gates.exec(function (err, dataGates) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {

                    var invoices = Invoice.aggregate([
                        {$match: {terminal: terminal}},
                        {$unwind: '$detalle'},
                        {$unwind: '$detalle.items'},
                        {$match: {'detalle.items.id': {$in: rates}}},
                        {$project: { contenedor: '$detalle.contenedor'}}
                    ]);

                    invoices.exec(function (err, dataInvoices) {

                        if (err) {
                            res.status(500).send({status: 'ERROR', data: err.message});
                        } else {
                            var gatesWoGates = linq.from(dataGates)
                                .except(dataInvoices, "$.contenedor").toArray();

                            res.status(200)
                                .send({
                                    status: 'OK',
                                    totalCount: gatesWoGates.length,
                                    data: gatesWoGates
                                });
                        }
                    });
                }
            });
        });
    }

    function addGate(req, res) {

        var usr = req.usr,
            gate2insert = req.body,
            inicio,
            fin,
            errMsg,
            strSubject,
            mailer,
            socketMsg;

        if (gate2insert.gateTimestamp === undefined || gate2insert.gateTimestamp === null || gate2insert.gateTimestamp === '') {
            res.status(500).send({status: "ERROR", data: "El Gate debe tener una Fecha Hora válida."});
            return;
        }

        gate2insert.gateTimestamp = moment(gate2insert.gateTimestamp);

        inicio = gate2insert.turnoInicio;
        if (inicio !== undefined && inicio !== '' && inicio !== null) {
            gate2insert.turnoInicio = moment(inicio);
        } else {
            gate2insert.turnoInicio = null;
        }

        fin = gate2insert.turnoFin;
        if (fin !== undefined && fin !== '' && fin !== null) {
            gate2insert.turnoFin = moment(fin);
        } else {
            gate2insert.turnoFin = null;
        }

        gate2insert.terminal = usr.terminal;
        if (gate2insert.buque === undefined || gate2insert.buque === null) {
            gate2insert.buque = "";
        } else {
            gate2insert.buque = gate2insert.buque.trim();
        }

        if (gate2insert.viaje === undefined || gate2insert.viaje === null) {
            gate2insert.viaje = "";
        } else {
            gate2insert.viaje = gate2insert.viaje.trim();
        }

        if (gate2insert.contenedor === undefined || gate2insert.contenedor === null) {
            gate2insert.contenedor = "";
        } else {
            gate2insert.contenedor = gate2insert.contenedor.trim();
        }

        if (gate2insert) {
            Gate.insert(gate2insert, function (errSave, gateNew) {
                if (errSave) {

                    errMsg = util.format('%s - ERROR: %s.-%s- \n%s', dateTime.getDatetime(), errSave.toString(), usr.terminal, JSON.stringify(req.body));
                    log.logger.error(errMsg);

                    strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                    mailer = new mail.mail(config.email);
                    mailer.send(usr.email, strSubject, errMsg);

                    res.status(500).send({status: "ERROR", data: errMsg});
                } else {
                    log.logger.insert('Gate INS: %s - %s - %s', gateNew._id, usr.terminal, moment(gateNew.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"));
                    socketMsg = {
                        status: 'OK',
                        data: gateNew
                    };
                    io.sockets.emit('gate', socketMsg);
                    res.status(200).send(socketMsg);
                }
            });
        }
    }

/*
router.use(function timeLog(req, res, next){
    log.logger.info('Time: %s', Date.now());
    next();
});
*/
    router.param('terminal', function (req, res, next, terminal) {
        var usr = req.usr;

        if (usr.terminal !== 'AGP' && usr.terminal !== terminal) {
            var errMsg = util.format('%s', 'La terminal recibida por parámetro es inválida para el token.');
            log.logger.error(errMsg);
            res.status(403).send({status: 'ERROR', data: errMsg});
        } else {
            next();
        }
    });


    function isValidToken(req, res, next) {

        var Account = require('../models/account.js'),
            incomingToken = req.headers.token;

        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(err);
                res.status(500).send({status: 'ERROR', data: err});
            } else {
                req.usr = usr;
                next();
            }
        });
    }

    router.get('/:terminal/:skip/:limit', getGates);
    router.get('/ByHour', getGatesByHour);
    router.get('/ByMonth', getGatesByMonth);
    router.get('/:terminal/missingGates', getMissingGates);
    router.get('/:terminal/missingInvoices', getMissingInvoices);
    router.get('/:terminal/ships', getDistincts);
    router.get('/:terminal/containers', getDistincts);

    app.post('/gate', isValidToken, addGate);

    return router;
};