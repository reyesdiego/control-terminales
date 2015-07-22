/**
 * Created by diego on 7/13/15.
 *
 * @module Paying
 */

module.exports = function (log) {
    'use strict';
    var express = require('express'),
        router = express.Router(),
        Invoice = require('../models/invoice.js'),
        Paying = require('../models/paying.js'),
        priceUtils = require('../include/price.js'),
        moment = require('moment');

    function _getNotPayed(req, paginated, callback) {

        var paramTerminal = req.params.terminal,
            invoices,
            price = new priceUtils.price(paramTerminal),
            skip,
            limit,
            order,
            estados;

        if (paginated) {
            estados = ['todo'];
        } else {
            estados = ['E', 'R', 'T'];
        }

        price.rates(false, function (err, prices) {
            var param,
                match;

            match = {
                terminal: paramTerminal,
                'fecha.emision': {$gte: new Date(2015, 1, 0, 0, 0)},
                'detalle.items.id': {$in: prices},
                'payment': {$exists: false}
            };

            param = [
                {$match: match },
                {$project: {terminal: 1, fecha: '$fecha.emision', estado: '$estado', codTipoComprob: 1, nroComprob: 1, nroPtoVenta: 1, detalle: '$detalle'}},
                {$unwind: '$estado'},
                {$group: {
                    _id:   {
                        _id: '$_id',
                        terminal: '$terminal',
                        fecha: '$fecha',
                        nroComprob: '$nroComprob',
                        codTipoComprob: '$codTipoComprob',
                        nroPtoVenta: '$nroPtoVenta',
                        detalle: '$detalle'
                    },
                    estado: {$last: '$estado'}
                }},
                {$project: {'_id': '$_id._id', nroPtoVenta: '$_id.nroPtoVenta', terminal: '$_id.terminal', nroComprob: '$_id.nroComprob', fecha: '$_id.fecha', codTipoComprob: '$_id.codTipoComprob', detalle: '$_id.detalle', estado: true}},
                {$match: {'estado.estado': {$nin: estados}}},
                {$unwind: '$detalle'},
                {$unwind: '$detalle.items'},
                {$match: {'detalle.items.id': {$in: prices}}},
                {$group: {
                    _id: {
                        _id: '$_id',
                        terminal: '$terminal',
                        nroComprob: '$nroComprob',
                        nroPtoVenta: '$nroPtoVenta',
                        codTipoComprob: '$codTipoComprob',
                        fecha: '$fecha',
                        estado: '$estado',
                        code: '$detalle.items.id'
                    },
                    importe: {
                        $sum: {
                            $cond: { if: {  $or:[
                                {$eq: [ "$codTipoComprob", 3 ] },
                                {$eq: [ "$codTipoComprob", 8 ] },
                                {$eq: [ "$codTipoComprob", 13 ] }
                            ]
                            },
                                then: {$multiply:['$detalle.items.impTot', -1]},
                                else: '$detalle.items.impTot'
                            }
                        }
                    },
                    cnt: {$sum : '$detalle.items.cnt'}
                }},
                {$project: {
                    _id: '$_id._id',
                    terminal: '$_id.terminal',
                    emision: '$_id.fecha',
                    nroPtoVenta: '$_id.nroPtoVenta',
                    codTipoComprob: '$_id.codTipoComprob',
                    nroComprob: '$_id.nroComprob',
                    code: '$_id.code',
                    importe: '$importe',
                    cnt: '$cnt',
                    estado: '$_id.estado'
                }}
            ];

            if (req.query.order) {
                order = JSON.parse(req.query.order);
                param.push({$sort: order[0]});
            } else {
                param.push({$sort: {'codTipoComprob': 1}});
            }

            if (paginated) {
                limit = parseInt(req.params.limit, 10);
                skip = parseInt(req.params.skip, 10);
                param.push({$skip: skip});
                param.push({$limit: limit});
            }

            invoices = Invoice.aggregate(param);
            invoices.exec(function (err, data) {
                if (err) {
                    callback(err);
                } else {
                    if (paginated) {
                        Invoice.count(match, function (err, count) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, {status: "OK", totalCount: count, data: data});
                            }
                        });
                    } else {
                        callback(null, {status: "OK", data: data});
                    }
                }
            });
        });
    }

    function getNotPayed(req, res) {
        var paginated = true;
        _getNotPayed(req, paginated, function (err, data) {
            if (err) {
                res.status(500).send({status: "ERROR", message: err.message, data: null});
            } else {
                res.status(200).send({status: "OK", totalCount: data.totalCount, data: data.data});
            }
        });
    }

    function getPayed(req, res) {
        var invoices,
            skip = parseInt(req.params.skip, 10),
            limit = parseInt(req.params.limit, 10),
            order;

        invoices = Invoice.find({'payment.number': req.params.number, terminal: req.params.terminal});

        if (req.query.order) {
            order = JSON.parse(req.query.order);
            invoices.sort(order[0]);
        } else {
            invoices.sort({'codTipoComprob': 1, 'nroComprob': 1});
        }
        invoices.skip(skip).limit(limit)

        invoices.exec(function (err, data) {
            if (err) {
                res.status(500).send({
                    status: 'ERROR',
                    message: err.message
                });
            } else {
                Invoice.count({'payment.number': req.params.number, terminal: req.params.terminal}, function (err, cnt) {
                    var pageCount = data.length,
                        result = {
                            status: 'OK',
                            totalCount: cnt,
                            pageCount: (limit > pageCount) ? pageCount : limit,
                            page: skip,
                            data: data
                        };
                    res.status(200).send(result);
                });
            }
        });
    }

    function setPayment (req, res) {
        var async = require('async'),
            paginated = false,
            paramTerminal;

        paramTerminal = req.params.terminal;

        _getNotPayed(req, paginated, function (err, data) {
            if (err) {
                res.status(500).send({status: "ERROR", message: err.message, data: null});
            } else {
                if (data.data.length > 0) {
                    Paying.aggregate([{$match: {terminal: paramTerminal}}, {$group: {_id: '', max: {$max: '$number'}}}], function (err, maxNumber) {
                        var nextPaymentNumber = 0;
                        if (maxNumber.length > 0) {
                            nextPaymentNumber = maxNumber[0].max;
                        }
                        nextPaymentNumber++;
                        Paying.create({
                            terminal: paramTerminal,
                            date: moment(req.body.fecha, 'YYYY-MM-DD HH:mm:SS Z').toDate(),
                            number: nextPaymentNumber,
                            total: 0
                        }, function (err, newPaying) {
                            if (err) {
                                res.status(500).send({status: 'ERROR', message: err.message});
                            } else {
                                async.forEach(data.data, function (item, callback) {
                                    Invoice.update({_id: item._id},
                                        {$set: {
                                            'payment': {
                                                date: newPaying.date,
                                                number: newPaying.number
                                            }
                                        }},
                                        function (err, rowAffected, data) {
                                            callback();
                                        });
                                }, function () {
                                    var totalPayment,
                                        price;

                                    log.logger.info("Payment: Se generó la Liquidación Nro: %s", nextPaymentNumber);
                                    price = new priceUtils.price(paramTerminal);
                                    price.rates(false, function (err, rates) {
                                        totalPayment = Invoice.aggregate([
                                            {$match: {terminal: paramTerminal, "payment.number": nextPaymentNumber}},
                                            {$project: {terminal:1, codTipoComprob:1, nroComprob: 1, detalle: '$detalle'}},
                                            {$unwind: '$detalle'},
                                            {$unwind: '$detalle.items'},
                                            {$match: {'detalle.items.id': {$in: rates }}},
                                            {$project: {
                                                terminal: 1,
                                                code: '$detalle.items.id',
                                                nroComprob: 1,
                                                cnt: '$detalle.items.cnt',
                                                importe: {
                                                    $cond: { if: {  $or: [
                                                        {$eq: [ "$codTipoComprob", 3 ] },
                                                        {$eq: [ "$codTipoComprob", 8 ] },
                                                        {$eq: [ "$codTipoComprob", 13 ] }
                                                    ]},
                                                        then: {$multiply: ['$detalle.items.impTot', -1]},
                                                        else: '$detalle.items.impTot'}
                                                }
                                            }},
                                            {$group: {
                                                _id: {
                                                    terminal: '$terminal'
                                                },
                                                importe: {$sum: '$importe'}
                                            }}
                                        ]);
                                        totalPayment.exec(function (err, totalPayment) {
                                            if (totalPayment.length > 0) {
                                                newPaying.total = totalPayment[0].importe;
                                                newPaying.save(function (err, newPayingSaved) {
                                                    res.status(200).send(
                                                        {
                                                            status: "OK",
                                                            data: "Se ha generado la siguiente Liquidación: " + nextPaymentNumber.toString()
                                                        }
                                                    );
                                                });
                                            } else {
                                                res.status(200).send(
                                                    {
                                                        status: "OK",
                                                        data: "Se ha generado la siguiente Liquidación: " + nextPaymentNumber.toString()
                                                    }
                                                );
                                            }
                                        });
                                    });
                                });
                            }
                        });
                    });
                } else {
                    res.status(500).send({
                        status: 'ERROR',
                        data: null,
                        message: "No hay comprobantes sin Liquidar."
                    });
                }
            }
        });
    }

    function getPayments (req, res) {
        var paying,
            skip = parseInt(req.params.skip, 10),
            limit = parseInt(req.params.limit, 10),
            paramTerminal = req.params.terminal;

        paying = Paying.find({terminal: paramTerminal});
        paying.skip(skip);
        paying.limit(limit);
        paying.exec(function (err, payings) {
            if (err) {
                res.status(500).send({
                    status: 'ERROR',
                    message: err.message,
                    data: null
                });
            } else {
                Paying.count({terminal: paramTerminal}, function (err, cnt) {
                    var pageCount = payings.length,
                        result = {
                            status: 'OK',
                            totalCount: cnt,
                            pageCount: (limit > pageCount) ? pageCount : limit,
                            page: skip,
                            data: payings
                        };
                    res.status(200).send(result);
                });
            }
        });
    }

    router.get('/payed/:terminal/:number/:skip/:limit', getPayed);
    router.get('/notPayed/:terminal/:skip/:limit', getNotPayed);
    router.get('/payments/:terminal/:skip/:limit', getPayments);
    router.post('/setPayment/:terminal', setPayment);

    return router;
}