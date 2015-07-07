/**
 * Created by Diego Reyes on 3/21/14.
 */

module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Invoice = require('../models/invoice.js'),
        Gate = require('../models/gate.js'),
        util = require('util'),
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
                fecha = moment(req.query.fechaInicio, ['YYYY-MM-DD HH:mm Z']);
                param.gateTimestamp['$gte'] = fecha;
            }
            if (req.query.fechaFin){
                fecha = moment(req.query.fechaFin, ['YYYY-MM-DD HH:mm Z']);
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
            jsonParam,
            fechaInicio,
            fechaFin;

        if (req.query.fechaInicio) {
            fechaInicio = moment(req.query.fechaInicio, ['YYYY-MM-DD']).toDate();
        }

        if (req.query.fechaFin) {
            fechaFin = moment(req.query.fechaFin, ['YYYY-MM-DD']).add(1, 'days').toDate();
        }

        if (req.query.fecha !== undefined) {
            fechaInicio = moment(req.query.fecha, ['YYYY-MM-DD']).toDate();
            fechaFin = moment(fechaInicio).add(1, 'days').toDate();
        }

        jsonParam = [
            {$match: { 'gateTimestamp': {$gte: fechaInicio, $lt: fechaFin} }},
            { $project: {
                gateTimestamp : {$subtract: [ '$gateTimestamp', 180 * 60 * 1000]},
                terminal: '$terminal'
            }},
            { $group : {
                _id : { terminal: '$terminal',
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
            date = moment().subtract(moment().date() - 1, 'days').format('YYYY-MM-DD'),
            month5Ago,
            nextMonth,
            jsonParam;

        if (req.query.fecha !== undefined) {
            date = moment(req.query.fecha, 'YYYY-MM-DD').subtract(moment(req.query.fecha).date() - 1, 'days');
        }
        month5Ago = moment(date).subtract(4, 'months').toDate();
        nextMonth = moment(date).add(1, 'months').toDate();

        jsonParam = [
            {$match: { 'gateTimestamp': {$gte: month5Ago, $lt: nextMonth} }},
            { $project : {
                terminal: '$terminal',
                gateTimestamp : {$subtract: [ '$gateTimestamp', 180 * 60 * 1000]}
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

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        if (distinct !== '') {
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
        } else {
            res.status(400).send({status: 'ERROR', message: 'El ruta es inválida', data: []});
        }
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
                var gates;
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    gates = Gate.find({terminal: terminal, carga: "LL"}, {contenedor: 1});
                    gates.exec(function (err, dataGates) {
                        var invoicesWoGates;
                        if (err) {
                            res.status(500).send({status: 'ERROR', data: err.message});
                        } else {
                            invoicesWoGates = linq.from(dataInvoices)
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
                var invoices;
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {

                    invoices = Invoice.aggregate([
                        {$match: {terminal: terminal}},
                        {$unwind: '$detalle'},
                        {$unwind: '$detalle.items'},
                        {$match: {'detalle.items.id': {$in: rates}}},
                        {$project: { contenedor: '$detalle.contenedor'}}
                    ]);

                    invoices.exec(function (err, dataInvoices) {
                        var gatesWoGates;
                        if (err) {
                            res.status(500).send({status: 'ERROR', data: err.message});
                        } else {
                            gatesWoGates = linq.from(dataGates)
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

    router.get('/:terminal/:skip/:limit', getGates);
    router.get('/ByHour', getGatesByHour);
    router.get('/ByMonth', getGatesByMonth);
    router.get('/:terminal/missingGates', getMissingGates);
    router.get('/:terminal/missingInvoices', getMissingInvoices);
    router.get('/:terminal/ships', getDistincts);
    router.get('/:terminal/containers', getDistincts);

    return router;
};