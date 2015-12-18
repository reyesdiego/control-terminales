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
        moment = require('moment'),
        VoucherType = require('../models/voucherType.js'),
        Enumerable = require('linq');

    function _getNotPayed(req, paginated, callback) {

        var paramTerminal = req.params.terminal,
            invoices,
            price = new priceUtils.price(paramTerminal),
            skip,
            limit,
            order,
            estados,
            desde,
            hasta,
            tipoDeSuma,
            cond,
            mongoose = require("mongoose"),
            response,
            groupByContainer,
            projectByContainer;

        //var matchPrice = require('../lib/matchPrice.js');
        //matchPrice = new matchPrice(paramTerminal);

        if ((req.query.fechaInicio === undefined || req.query.fechaFin === undefined) && req.params._id === undefined) {
            callback({status: "ERROR", message: "Debe proveer parametros de fecha"});
        } else {

            VoucherType.find({type: -1}, function (err, vouchertypes) {
                if (err) {
                    callback({status: "ERROR", message: err.message});
                } else {
                    cond = Enumerable.from(vouchertypes)
                        .select(function (item) {
                            if (item.type === -1) {
                                return {$eq: ["$codTipoComprob", item._id]};
                            }
                        }).toArray();

                    if (paginated) {
                        estados = ['todo'];
                        tipoDeSuma = '$detalle.items.impTot';
                    } else {
                        estados = ['E', 'R', 'T'];
                        tipoDeSuma = {
                            $cond: { if: {$or: cond},
                                then: {$multiply: ['$detalle.items.impTot', -1]},
                                else: '$detalle.items.impTot'}
                        };
                    }

                    price.ratePrices(function (err, prices) {
                        var param,
                            match,
                            _id,
                            rates;

                        rates = Enumerable.from(prices)
                            .select('z=>z.code')
                            .toArray();

                        _id = mongoose.Types.ObjectId(req.params._id);

                        if (req.params._id) {
                            match = {
                                payment: _id
                            };
                        } else {

                            desde = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
                            if (desde < new Date(2015, 1, 0, 0, 0)) {
                                desde = new Date(2015, 1, 0, 0, 0);
                            }
                            hasta = moment(req.query.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

                            match = {
                                terminal: paramTerminal,
                                'fecha.emision': {$gte: desde, $lt: hasta},
                                'detalle.items.id': {$in: rates},
                                'payment': {$exists: false}
                            };

                            if (req.query.codTipoComprob) {
                                match.codTipoComprob = parseInt(req.query.codTipoComprob, 10);
                            }
                            if (req.query.buqueNombre) {
                                match['detalle.buque.nombre'] = req.query.buqueNombre;
                            }
                            if (req.query.razonSocial) {
                                match.razon = req.query.razonSocial;
                            }
                        }

                        groupByContainer = {
                            _id: '$_id',
                            terminal: '$terminal',
                            nroPtoVenta: '$nroPtoVenta',
                            codTipoComprob: '$codTipoComprob',
                            razon: '$razon',
                            fecha: '$fecha',
                            estado: '$estado',
                            code: '$detalle.items.id',
                            impUnit: '$detalle.items.impUnit',
                            cotiMoneda: '$cotiMoneda',
                            buque: '$detalle.buque.nombre'};
                        projectByContainer = {
                            _id: '$_id._id',
                            terminal: '$_id.terminal',
                            emision: '$_id.fecha',
                            nroPtoVenta: '$_id.nroPtoVenta',
                            codTipoComprob: '$_id.codTipoComprob',
                            buque: '$_id.buque',
                            razon: '$_id.razon',
                            cotiMoneda: '$_id.cotiMoneda',
                            code: '$_id.code',
                            impUnit: '$_id.impUnit',
                            tasa: {$multiply: ['$_id.impUnit', '$cnt']},
                            cnt: '$cnt',
                            estado: '$_id.estado'
                        }
                        if (req.query.byContainer === '1') {
                            groupByContainer.container = '$detalle.contenedor';
                            projectByContainer.container = '$_id.container';
                        }

                        param = [
                            {$match: match },
                            {$project: {
                                terminal: 1,
                                fecha: '$fecha.emision',
                                estado: 1,
                                codTipoComprob: 1,
                                nroPtoVenta: 1,
                                razon: 1,
                                detalle: 1,
                                cotiMoneda: 1
                            }},
                            {$unwind: '$estado'},
                            {$group: {
                                _id:   {
                                    _id: '$_id',
                                    terminal: '$terminal',
                                    fecha: '$fecha',
                                    codTipoComprob: '$codTipoComprob',
                                    nroPtoVenta: '$nroPtoVenta',
                                    razon: '$razon',
                                    detalle: '$detalle',
                                    cotiMoneda: '$cotiMoneda'
                                },
                                estado: {$last: '$estado'}
                            }},
                            {$project: {
                                '_id': '$_id._id',
                                nroPtoVenta: '$_id.nroPtoVenta',
                                terminal: '$_id.terminal',
                                fecha: '$_id.fecha',
                                codTipoComprob: '$_id.codTipoComprob',
                                razon: '$_id.razon',
                                detalle: '$_id.detalle',
                                cotiMoneda: '$_id.cotiMoneda',
                                estado: true
                            }},
                            {$match: {'estado.estado': {$nin: estados}}},
                            {$unwind: '$detalle'},
                            {$unwind: '$detalle.items'},
                            {$match: {'detalle.items.id': {$in: rates}}},
                            {$group: {
                                _id: groupByContainer,
                                cnt: {
                                    $sum: {
                                        $cond: { if: {$or: cond},
                                            then: {$multiply: ['$detalle.items.cnt', -1]},
                                            else: '$detalle.items.cnt'}
                                    }
                                }
                            }},
                            {$project: projectByContainer}
                        ];

                        if (req.query.order) {
                            order = JSON.parse(req.query.order);
                            param.push({$sort: order[0]});
                        } else {
                            param.push({$sort: {'fecha.emision': 1}});
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
                                response = Enumerable.from(data)
                                    .join(Enumerable.from(prices), '$.code', '$.code', function (tasaInvoice, price) {
                                        var top = Enumerable.from(price.price.topPrices)
                                            .where(function (itemW) {
                                                if (itemW.from < tasaInvoice.emision) {
                                                    return true;
                                                } else {
                                                    return false;
                                                }
                                            })
                                            .orderByDescending('$.from')
                                            .toArray();

                                        tasaInvoice.impUnitAgp = 0;
                                        if (top.length > 0) {
                                            tasaInvoice.impUnitAgp = top[0].price;
                                        }
                                        tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                        tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                        tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                        tasaInvoice.cnt = Math.abs(tasaInvoice.cnt);
                                        return tasaInvoice;
                                    }).toArray();

                                if (paginated) {
                                    Invoice.count(match, function (err, count) {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            callback(null, {status: "OK", totalCount: count, data: response});
                                        }
                                    });
                                } else {
                                    callback(null, {status: "OK", data: response});
                                }
                            }
                        });
                    });

                }
            });
        }
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
/*
        var invoices,
            skip = parseInt(req.params.skip, 10),
            limit = parseInt(req.params.limit, 10),
            order;

        invoices = Invoice.find({'payment': req.params._id, terminal: req.params.terminal});

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
                Invoice.count({'payment': req.params._id, terminal: req.params.terminal}, function (err, cnt) {
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
*/
        var paginated = true;
        _getNotPayed(req, paginated, function (err, data) {
            if (err) {
                res.status(500).send({status: "ERROR", message: err.message, data: null});
            } else {
                res.status(200).send({status: "OK", totalCount: data.totalCount, data: data.data});
            }
        });

    }

    function add2PrePayment(req, res) {
        var async = require('async'),
            paginated = false,
            invoicesCnt;

        _getNotPayed(req, paginated, function (err, data) {
            if (err) {
                res.status(400).send({status: "ERROR", message: err.message, data: null});
            } else {
                invoicesCnt = data.data.length;
                if (invoicesCnt > 0) {
                    async.forEach(data.data, function (item, callback) {
                        Invoice.update({_id: item._id},
                            {$set: {
                                'payment': req.body.paymentId
                            }},
                            function (err, rowAffected, data) {
                                callback();
                            });
                    }, function () {
                        res.status(200).send({status: "OK",  message: "Se agregaron " + invoicesCnt.toString() + " a la preliquidación."});
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

    function calculatePrePayment(param, callback) {
        var totalPayment,
            price,
            cond;

        VoucherType.find({type: -1}, function (err, vouchertypes) {
            if (err) {
                callback({status: "ERROR", message: err.message});
            } else {
                cond = Enumerable.from(vouchertypes)
                    .select(function (item) {
                        if (item.type === -1) {
                            return {$eq: ["$codTipoComprob", item._id]};
                        }
                    }).toArray();

                price = new priceUtils.price(param.terminal);
                price.ratePrices(function (err, prices) {
                    var rates;

                    rates = Enumerable.from(prices)
                        .select('z=>z.code')
                        .toArray();

                    param = [
                        {$match: param},
                        {$project: {
                            terminal: 1,
                            codTipoComprob: 1,
                            nroComprob: 1,
                            payment: 1,
                            fecha: '$fecha.emision',
                            cotiMoneda: 1,
                            detalle: 1
                        }},
                        {$unwind: '$detalle'},
                        {$unwind: '$detalle.items'},
                        {$match: {'detalle.items.id': {$in: rates }}},
                        {$project: {
                            terminal: 1,
                            code: '$detalle.items.id',
                            nroComprob: 1,
                            cotiMoneda: 1,
                            fecha: 1,
                            payment: 1,
                            cnt: {
                                $cond: { if: {  $or: cond },
                                        then: {$multiply: ['$detalle.items.cnt', -1]},
                                        else: '$detalle.items.cnt'}
                            },
                            impUnit: '$detalle.items.impUnit'
                        }}
                    ];
                    totalPayment = Invoice.aggregate(param);
                    totalPayment.exec(function (err, totalPayment) {
                        var result = Enumerable.from(totalPayment)
                            .join(Enumerable.from(prices), '$.code', '$.code', function (tasaInvoice, price) {

                                var top = Enumerable.from(price.price.topPrices)
                                    .where(function (itemW) {
                                        if (itemW.from < tasaInvoice.fecha) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    })
                                    .orderByDescending('$.from')
                                    .toArray();
                                tasaInvoice.type = price.price._doc.rate;
                                price.price.topPrices = top[0];
                                tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                return tasaInvoice;
                            })
                            .groupBy("$.code", null,
                                function (key, g) {
                                    var r = {
                                        _id: {code: key},
                                        cnt: g.sum("$.cnt"),
                                        total: g.sum("$.tasa"),
                                        totalPeso: g.sum("$.totalTasa"),
                                        totalAgp: g.sum("$.tasaAgp"),
                                        totalPesoAgp: g.sum("$.totalTasaAgp")
                                    };
                                    r.cnt = Math.abs(r.cnt);
                                    return r;
                                }).toArray();

                        if (err) {
                            callback(err);
                        } else {
                            callback(null,  result);
                        }
                    });
                });
            }
        });
    }

    function getPrePayment(req, res) {
        var mongoose = require("mongoose"),
            moment = require("moment"),
            param = {},
            desde,
            hasta;

        if (req.query.paymentId) {
            param.payment = mongoose.Types.ObjectId(req.query.paymentId);
            param.terminal = req.params.terminal;
        } else {
            desde = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
            if (desde < new Date(2015, 1, 0, 0, 0)) {
                desde = new Date(2015, 1, 0, 0, 0);
            }
            hasta = moment(req.query.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

            param = {
                terminal: req.params.terminal,
                'fecha.emision': {$gte: desde, $lt: hasta},
                //'detalle.items.id': {$in: rates},
                'payment': {$exists: false}
            };

            if (req.query.codTipoComprob) {
                param.codTipoComprob = parseInt(req.query.codTipoComprob, 10);
            }
            if (req.query.buqueNombre) {
                param['detalle.buque.nombre'] = req.query.buqueNombre;
            }
            if (req.query.razonSocial) {
                param.razon = req.query.razonSocial;
            }

        }
        calculatePrePayment(param, function (err, payment) {
            if (err) {
                res.status(500).send(
                    {
                        status: "ERROR",
                        message: "Ha ocurrido un error al obtener los datos de la pre liquidación."
                    }
                );
            } else {
                res.status(200).send(
                    {
                        status: "OK",
                        data: payment
                    }
                );
            }
        });
    }

    function setPrePayment(req, res) {
        var param,
            payment,
            paramTerminal,
            nextPaymentNumber;

        paramTerminal = req.body.terminal;

        param = [{$match: {terminal: paramTerminal}}, {$group: {_id: '', max: {$max: '$preNumber'}}}];
        payment = Paying.aggregate(param);
        payment.exec(function (err, maxNumber) {
            nextPaymentNumber = 0;
            if (maxNumber.length > 0) {
                nextPaymentNumber = maxNumber[0].max;
            }
            Paying.create({
                terminal: paramTerminal,
                date: moment(req.body.fecha, 'YYYY-MM-DD HH:mm:SS Z').toDate(),
                preNumber: ++nextPaymentNumber,
                vouchers: 0,
                tons: 0,
                total: 0
            }, function (err, newPaying) {
                if (err) {
                    res.status(500).send({status: "ERROR", message: err.message});
                } else {
                    res.status(200).send({status: "OK", data: newPaying});
                }
            });
        });
    }

    function setPayment(req, res) {
        var param,
            payment,
            paramTerminal,
            nextPaymentNumber;

        paramTerminal = req.body.terminal;

        param = [{$match: {terminal: paramTerminal}}, {$group: {_id: '', max: {$max: '$number'}}}];
        payment = Paying.aggregate(param);
        payment.exec(function (err, maxNumber) {
            nextPaymentNumber = 0;
            if (maxNumber.length > 0) {
                nextPaymentNumber = (maxNumber[0].max === null) ? 0 : maxNumber[0].max;
            }
            Paying.findOne({terminal: paramTerminal, preNumber: req.body.preNumber}, function (err, payment) {
                if (payment.number !== undefined && payment.number !== null) {
                    res.status(500).send({
                        status: "ERROR",
                        message: "La Preliquidación ya se encuentra liquidada",
                        data: payment
                    });
                } else {
                    calculatePrePayment({terminal: paramTerminal, payment: payment._id}, function (err, prePayment) {
                        var detail;
                        payment.number = ++nextPaymentNumber;
                        payment.date = Date.now();
                        payment.detail = [];
                        prePayment.forEach(function (item) {
                            detail = {
                                _id: item._id.code,
                                cant: item.cnt,
                                totalDol: item.total,
                                totalPes: item.totalPeso,
                                iva: item.totalPeso * 21 / 100,
                                total: item.totalPeso + (item.totalPeso * 21 / 100)
                            };
                            payment.detail.push(detail);
                        });
                        payment.save(function (err, paymentSaved) {
                            if (err) {
                                res.status(500).send({
                                    status: "ERROR",
                                    message: err.message
                                });
                            } else {
                                res.status(200).send({
                                    status: "OK",
                                    message: "Se ha generado la Liquidación nro " + nextPaymentNumber,
                                    data: paymentSaved
                                });
                            }
                        });
                    });
                }
            });
        });
    }

    function getPayments(req, res) {
        var paying,
            skip = parseInt(req.params.skip, 10),
            limit = parseInt(req.params.limit, 10),
            paramTerminal = req.params.terminal,
            isNumberExists = true,
            param;

        if (req.route.path.indexOf('rePayments') > 0) {
            isNumberExists = false;
        }

        param ={terminal: paramTerminal, number: {$exists: isNumberExists}};

        paying = Paying.find(param);
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
                Paying.count(param, function (err, cnt) {
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

    function deletePrePayment(req, res) {

        var _id = req.params._id;

        Paying.find({_id: _id}, function (err, payings) {
            if (err) {
                res.status(500).send({
                    status: 'ERROR',
                    message: err.message
                });
            } else {
                if (payings.length !== 1) {
                    res.status(500).send({
                        status: 'ERROR',
                        message: "La Liquidación no existe."
                    });
                } else {
                    Invoice.update({payment: _id}, {$unset: {payment: ''}}, {multi: true}, function (err, rowAffected) {
                        if (err) {
                            res.status(500).send({
                                status: 'ERROR',
                                message: err.message
                            });
                        } else {
                            Paying.remove({_id: _id}, function (err) {
                                var msg = 'La Liquidación ha sido eliminada y ' + rowAffected + ' comprobantes han sido liberados.';
                                log.logger.info(msg);
                                res.status(200).send({
                                    status: 'OK',
                                    message: msg,
                                    data: null
                                });
                            });
                        }
                    });
                }
            }
        });
    }

    router.get('/payed/:terminal/:_id/:skip/:limit', getPayed);
    router.get('/notPayed/:terminal/:skip/:limit', getNotPayed);
    router.get('/payments/:terminal/:skip/:limit', getPayments);
    router.get('/prePayments/:terminal/:skip/:limit', getPayments);

    router.post('/prePayment', setPrePayment);
    router.delete('/prePayment/:_id', deletePrePayment);
    router.put('/payment', setPayment);
    router.get('/getPrePayment/:terminal', getPrePayment);
    router.put('/addToPrePayment/:terminal', add2PrePayment);

    return router;
}
