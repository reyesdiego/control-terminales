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
            limit;

        price.rates(false, function (err, prices) {

            var match = {
                terminal: paramTerminal,
                'fecha.emision': {$gte: new Date(2015, 1, 0, 0, 0)},
                'detalle.items.id': {$in: prices},
                'payment': {$exists: false}
            };

            var param = [
                {$match: match},
                {$project: {terminal: 1, fecha: '$fecha.emision', codTipoComprob: 1, nroComprob: 1, detalle: '$detalle'}},
                {$unwind: '$detalle'},
                {$unwind: '$detalle.items'},
                {$match: {'detalle.items.id': {$in: prices}}},
                {$project: {terminal: 1, code: '$detalle.items.id', fecha: 1, nroComprob: 1, codTipoComprob:1, cnt: '$detalle.items.cnt', importe: '$detalle.items.impTot', contenedor: '$detalle.contenedor'} },
                {$group: {
                    _id: {
                        _id: '$_id',
                        fecha: '$fecha',
                        terminal: '$terminal',
                        codTipoComprob: '$codTipoComprob',
                        nroComprob: '$nroComprob',
                        code: '$code'
                    },
                    importe: {$sum: '$importe'},
                    cnt: {$sum: '$cnt'}
                }},
                {$sort: {'_id.codTipoComprob': 1}}
            ];
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
            limit = parseInt(req.params.limit, 10);

        invoices = Invoice.find({'payment.number': req.params.number, terminal: req.params.terminal});
        invoices.skip(skip);
        invoices.limit(limit);

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
                                    Invoice.update({_id: item._id._id},
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
                                            {$project: {terminal: 1, code: '$detalle.items.id', nroComprob: 1, cnt: '$detalle.items.cnt', importe: '$detalle.items.impTot', contenedor: '$detalle.contenedor'} },
                                            {$group: {
                                                _id: {
                                                    terminal: '$terminal'
                                                },
                                                importe: {$sum: '$importe'}
                                            }}
                                        ]);
                                        totalPayment.exec( function (err, totalPayment) {
                                            newPaying.total = totalPayment[0].importe;
                                            newPaying.save(function (err, newPayingSaved) {
                                                res.status(200).send(
                                                    {
                                                        status: "OK",
                                                        data: "Se ha generado la siguiente Liquidación: " + nextPaymentNumber.toString()
                                                    }
                                                );
                                            });
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