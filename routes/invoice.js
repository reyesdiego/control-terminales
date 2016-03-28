/**
 * Created by Diego Reyes on 1/7/14.
 *
 * @module Routes
 */
module.exports = function (log, io, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require('util'),
        moment = require('moment'),
        config = require('../config/config.js'),
        Invoice = require('../models/invoice.js'),
        Gate = require('../models/gate.js'),
        MatchPrice = require('../models/matchPrice.js'),
        VoucherType = require('../models/voucherType.js'),
        Enumerable = require('linq');

    //GET - Return all invoice in the DB
    function getInvoices(req, res) {

        var usr = req.usr,
            paramTerminal = req.params.terminal,
            limit = parseInt(req.params.limit, 10),
            skip = parseInt(req.params.skip, 10),
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal,
            param = {},
            inv = require('../lib/invoice.js'),
            inv2 = require('../lib/invoice2.js');

        inv = new inv(ter);
        inv2 = new inv2();

        param.fechaInicio = req.query.fechaInicio;
        param.fechaFin = req.query.fechaFin;
        param.nroPtoVenta = req.query.nroPtoVenta;
        param.codTipoComprob = req.query.codTipoComprob;
        param.nroComprobante = req.query.nroComprobante;
        param.razonSocial = req.query.razonSocial;
        param.documentoCliente = req.query.documentoCliente;
        param.contenedor = req.query.contenedor;
        param.buqueNombre = req.query.buqueNombre;
        param.viaje = req.query.viaje;
        param.code = req.query.code;
        param.payment = req.query.payment;
        param.rates = req.query.rates;
        param.estado = req.query.estado;
        param.order = req.query.order;
        param.group = usr.group;
        param.resend = req.query.resend;
        param.terminal = paramTerminal;

        if (skip >= 0 && limit >= 0) {
            param.skip = skip;
            param.limit = limit;
            log.time("tiempo");
            inv2.getInvoices(param, function (err, result) {
                if (err) {
                    res.status(500).send({status: "ERROR", data: err.message});
                } else {
                    result.time = log.timeEnd("tiempo");
                    res.status(200).send(result);
                }
            });
        } else {
            inv.getInvoicesCSV(param, function (err, result) {
                if (err) {
                    res.status(500).send({status: "ERROR", data: err.message});
                } else {
                    res.header('content-type', 'text/csv');
                    res.header('content-disposition', 'attachment; filename=report.csv');
                    res.status(200).send(result);
                }
            });
        }

    }

    function getInvoice(req, res) {
        var Invoice = require('../lib/invoice2.js'),
            usr = req.usr,
            param = {
                _id: req.params.id
            },
            invoice;

        if (usr.role !== 'agp') {
            param.terminal = usr.terminal;
        }
        invoice = new Invoice();
        invoice.getInvoice(param, function (err, data) {
            if (err) {
                log.logger.error("%s", err.error);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getCounts(req, res) {

        var param = {},
            Invoice = require('../lib/invoice2.js');

        Invoice = new Invoice();

        param.fecha = req.query.fecha;

        Invoice.getCounts(param, function (err, data) {

            if (err) {
                log.logger.error(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getCountByDate(req, res) {

        var Invoice = require('../lib/invoice2.js');
        var param = {};

        Invoice = new Invoice();

        if (req.query.fecha !== undefined) {
            param.fecha = req.query.fecha;
        }
        Invoice.getCountByDate(param, function (err, data) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getCountByMonth(req, res) {

        var Invoice = require('../lib/invoice2.js'),
            param = {};

        Invoice = new Invoice();

        if (req.query.fecha !== undefined) {
            param.fecha = req.query.fecha;
        }

        Invoice.getCountByMonth(param, function (err, data) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getNoRates(req, res) {

        var terminal = req.params.terminal,
            Invoice = require('../lib/invoice2.js'),
            invoice,
            fecha,
            param = {};


        param.skip = parseInt(req.params.skip, 10);
        param.limit = parseInt(req.params.limit, 10);
        param.terminal = terminal;

        if (req.query.fechaInicio || req.query.fechaFin) {
            if (req.query.fechaInicio) {
                fecha = moment(moment(req.query.fechaInicio, 'YYYY-MM-DD')).toDate();
                param.fechaInicio = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(moment(req.query.fechaFin, 'YYYY-MM-DD')).toDate();
                param.fechaFin = fecha;
            }
        }
        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.razonSocial) {
            param.razon = req.query.razonSocial;
        }
        invoice = new Invoice();

        invoice.getNoRates(param, function (err, invoices) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(invoices);
            }
        });

    }

    function getRatesTotal(req, res) {

        var today = moment(moment().format('YYYY-MM-DD')).toDate(),
            tomorrow = moment(moment().format('YYYY-MM-DD')).add(1, 'days').toDate(),
            _price,
            _rates,
            sum = {},
            jsonParam;

        if (req.query.fecha !== undefined) {
            today = moment(req.query.fecha, 'YYYY-MM-DD').toDate();
            tomorrow = moment(req.query.fecha, 'YYYY-MM-DD').add(1, 'days').toDate();
        }

        _price = require('../include/price.js');
        _rates = new _price.price();
        _rates.rates(function (err, rates) {

            if (req.params.currency === 'PES') {
                sum = { $cond: [
                    {$eq: ['$codMoneda', 'PES' ]},
                    '$detalle.items.impTot',
                    {$multiply: ['$detalle.items.impTot', '$cotiMoneda'] }
                ]};
            } else if (req.params.currency === 'DOL') {
                sum = { $cond: [
                    {$eq: ['$codMoneda', 'DOL' ]},
                    '$detalle.items.impTot',
                    {$divide: ['$detalle.items.impTot', '$cotiMoneda'] }
                ]};
            }

            jsonParam = [
                {$match : {'fecha.emision': {$gte: today, $lt: tomorrow}}},
                {$unwind : '$detalle'},
                {$unwind : '$detalle.items'},
                {$match : {'detalle.items.id' : {$in: rates}}},
                {$project : {terminal: 1, 'detalle.items': 1, "total" : sum }},
                {$group  : {
                    _id: { terminal: '$terminal'},
                    cnt: { $sum: 1},
                    total: {$sum: '$total'}
                }}
            ];
            Invoice.aggregate(jsonParam, function (err, data) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message });
                } else {
                    res.status(200)
                        .send({
                            status: 'OK',
                            data: data
                        });
                }
            });
        });
    }

    function getRatesLiquidacion(req, res) {

        var desde,
            hasta,
            _price,
            _rates,
            cond;

        if (req.query.fechaInicio === undefined || req.query.fechaFin === undefined) {
            res.status(401).send({status: "ERROR", message: "Debe proveer parametros de fecha"});
        } else {
            desde = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
            hasta = moment(req.query.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

            VoucherType.find({type: -1}, function (err, vouchertypes) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data : err.message});
                } else {
                    cond = Enumerable.from(vouchertypes)
                        .select(function (item) {
                            if (item.type === -1) {
                                return {$eq: [ "$codTipoComprob", item._id]};
                            }
                        }).toArray();

                    _price = require('../include/price.js');
                    _rates = new _price.price();
                    _rates.ratePrices(function (err, prices) {
                        var invoice,
                            param,
                            rates;

                        rates = Enumerable.from(prices)
                            .select('z=>z.code')
                            .toArray();

                        if (err) {
                            res.status(500).send({status: 'ERROR', data : err.message});
                        } else {
                            param = [
                                { $match : {
                                    'fecha.emision': {$gte: desde, $lt: hasta}
                                }},
                                { $unwind : '$detalle'},
                                { $unwind : '$detalle.items'},
                                { $match : {
                                    'detalle.items.id' : { $in : rates}
                                }},
                                {$project : {
                                    terminal: '$terminal',
                                    code: '$detalle.items.id',
                                    cotiMoneda: '$cotiMoneda',
                                    cnt: { $cond: [
                                        {$or : cond },
                                        {$multiply: ['$detalle.items.cnt', -1]},
                                        '$detalle.items.cnt'
                                    ]},
                                    impUnit: '$detalle.items.impUnit',
                                    impTot: '$detalle.items.impTot'
                                }}];
                            invoice = Invoice.aggregate(param);

                            invoice.exec(function (err, data) {
                                var mp,
                                    result;

                                if (err) {
                                    res.status(500).send({status: 'ERROR', data : err.message});
                                } else {

                                    result = Enumerable.from(data)
                                        .join(Enumerable.from(prices), '$.code', '$.code', function (tasaInvoice, price) {
                                            tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                            tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                            tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                            tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                            tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                            return tasaInvoice;
                                        })
                                        .groupBy('x=>JSON.stringify({code: x.code, terminal: x.terminal})', null,
                                            function (key, g) {
                                                var r;
                                                key = JSON.parse(key);
                                                r = {
                                                    _id: {code: key.code, terminal: key.terminal},
                                                    cnt: g.sum("$.cnt"),
                                                    total: g.sum("$.tasa"),
                                                    totalPeso: g.sum("$.totalTasa"),
                                                    totalAgp: g.sum("$.tasaAgp"),
                                                    totalPesoAgp: g.sum("$.totalTasaAgp")
                                                };
                                                r.cnt = Math.abs(r.cnt);
                                                return r;
                                            }).toArray();

                                    mp = MatchPrice.find({match: {$in: rates}}, {price: true, match : true});
                                    mp.populate({path: 'price', match: {rate: {$exists: true}}});
                                    mp.exec(function (err, dataMatch) {

                                        mp = Enumerable.from(dataMatch)
                                            .select(function (item) {
                                                return {code: item.match[0], rate: item.price.toObject().rate};
                                            }).toArray();
                                        mp = Enumerable.from(result)
                                            .join(Enumerable.from(mp), '$._id.code', '$.code', function (left, right){
                                                return {
                                                    code : right.code,
                                                    rate: right.rate,
                                                    terminal: left._id.terminal,
                                                    ton: left.cnt,
                                                    total: left.total,
                                                    totalPeso: left.totalPeso,
                                                    totalAgp: left.totalAgp,
                                                    totalPesoAgp: left.totalPesoAgp
                                                };
                                            }).toArray();

                                        res.status(200).send({status: 'OK', data : mp});
                                    });
                                }
                            });
                        }
                    });

                }
            });

        }

    }

    function getRatesDate(req, res) {

        var desde,
            hasta,
            _price,
            _rates,
            cond;

        if (req.query.fechaInicio === undefined || req.query.fechaFin === undefined) {
            res.status(401).send({status: "ERROR", message: "Debe proveer parametros de fecha"});
        } else {
            desde = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
            hasta = moment(req.query.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

            VoucherType.find({type: -1}, function (err, vouchertypes) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data : err.message});
                } else {
                    cond = Enumerable.from(vouchertypes)
                        .select(function (item) {
                            if (item.type === -1) {
                                return {$eq: [ "$codTipoComprob", item._id]};
                            }
                        }).toArray();

                    _price = require('../include/price.js');
                    _rates = new _price.price();
                    _rates.ratePrices(function (err, prices) {
                        var invoice,
                            param,
                            rates;

                        rates = Enumerable.from(prices)
                            .select('z=>z.code')
                            .toArray();

                        if (err) {
                            res.status(500).send({status: 'ERROR', data : err.message});
                        } else {
                            param = [
                                { $match : {
                                    'fecha.emision': {$gte: desde, $lt: hasta}
                                }},
                                { $unwind : '$detalle'},
                                { $unwind : '$detalle.items'},
                                { $match : {
                                    'detalle.items.id' : { $in : rates}
                                }},
                                {$project : {
                                    terminal: '$terminal',
                                    code: '$detalle.items.id',
                                    date: '$fecha.emision',
                                    cotiMoneda: '$cotiMoneda',
                                    cnt: { $cond: [
                                        {$or : cond },
                                        {$multiply: ['$detalle.items.cnt', -1]},
                                        '$detalle.items.cnt'
                                    ]},
                                    impUnit: '$detalle.items.impUnit',
                                    impTot: '$detalle.items.impTot'
                                }}];
                            invoice = Invoice.aggregate(param);

                            invoice.exec(function (err, data) {
                                var mp,
                                    result;

                                if (err) {
                                    res.status(500).send({status: 'ERROR', data : err.message});
                                } else {

                                    result = Enumerable.from(data)
                                        .join(Enumerable.from(prices), '$.code', '$.code', function (tasaInvoice, price) {
                                            tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                            tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                            tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                            tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                            tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                            return tasaInvoice;
                                        })
                                        .groupBy('x=>JSON.stringify({code: x.code, terminal: x.terminal, date: x.date})', null,
                                            function (key, g) {
                                                var r;
                                                key = JSON.parse(key);
                                                r = {
                                                    _id: {code: key.code, terminal: key.terminal, date: key.date},
                                                    cnt: g.sum("$.cnt"),
                                                    total: g.sum("$.tasa"),
                                                    totalPeso: g.sum("$.totalTasa"),
                                                    totalAgp: g.sum("$.tasaAgp"),
                                                    totalPesoAgp: g.sum("$.totalTasaAgp")
                                                };
                                                r.cnt = Math.abs(r.cnt);
                                                return r;
                                            }).toArray();

                                    mp = MatchPrice.find({match: {$in: rates}}, {price: true, match : true});
                                    mp.populate({path: 'price', match: {rate: {$exists: true}}});
                                    mp.exec(function (err, dataMatch) {

                                        mp = Enumerable.from(dataMatch)
                                            .select(function (item) {
                                                return {code: item.match[0], rate: item.price.toObject().rate};
                                            }).toArray();
                                        mp = Enumerable.from(result)
                                            .join(Enumerable.from(mp), '$._id.code', '$.code', function (left, right) {
                                                return {
                                                    code : right.code,
                                                    rate: right.rate,
                                                    terminal: left._id.terminal,
                                                    date: left._id.date,
                                                    ton: left.cnt,
                                                    total: left.total,
                                                    totalPeso: left.totalPeso,
                                                    totalAgp: left.totalAgp,
                                                    totalPesoAgp: left.totalPesoAgp
                                                };
                                            })
                                            .orderBy('$.date').thenBy('$.terminal')
                                            .toArray();

                                        res.status(200).send({status: 'OK', data : mp});
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    function getRatesMonth(req, res) {

        var desde,
            hasta,
            _price,
            _rates,
            cond;

        if (req.query.fechaInicio === undefined || req.query.fechaFin === undefined) {
            res.status(401).send({status: "ERROR", message: "Debe proveer parametros de fecha"});
        } else {
            desde = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
            hasta = moment(req.query.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

            VoucherType.find({type: -1}, function (err, vouchertypes){
                if (err) {
                    res.status(500).send({status: 'ERROR', data : err.message});
                } else {
                    cond = Enumerable.from(vouchertypes)
                        .select(function (item) {
                            if (item.type === -1) {
                                return {$eq: [ "$codTipoComprob", item._id]};
                            }
                        }).toArray();

                    _price = require('../include/price.js');
                    _rates = new _price.price();
                    _rates.ratePrices(function (err, prices) {
                        var invoice,
                            param,
                            rates;

                        rates = Enumerable.from(prices)
                            .select('z=>z.code')
                            .toArray();

                        if (err) {
                            res.status(500).send({status: 'ERROR', data : err.message});
                        } else {
                            param = [
                                { $match : {
                                    'fecha.emision': {$gte: desde, $lt: hasta}
                                }},
                                { $unwind : '$detalle'},
                                { $unwind : '$detalle.items'},
                                { $match : {
                                    'detalle.items.id' : { $in : rates}
                                }},
                                {$project : {
                                    terminal: '$terminal',
                                    code: '$detalle.items.id',
                                    year: {$year: '$fecha.emision'},
                                    month: {$month: '$fecha.emision'},
                                    cotiMoneda: '$cotiMoneda',
                                    cnt: { $cond: [
                                        {$or : cond },
                                        {$multiply: ['$detalle.items.cnt', -1]},
                                        '$detalle.items.cnt'
                                    ]
                                    },
                                    impUnit: '$detalle.items.impUnit',
                                    impTot: '$detalle.items.impTot'
                                }}];
                            invoice = Invoice.aggregate(param);

                            invoice.exec(function (err, data) {
                                var mp,
                                    result;

                                if (err) {
                                    res.status(500).send({status: 'ERROR', data : err.message});
                                } else {

                                    result = Enumerable.from(data)
                                        .join(Enumerable.from(prices), '$.code', '$.code', function (tasaInvoice, price) {
                                            tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                            tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                            tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                            tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                            tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                            return tasaInvoice;
                                        })
                                        .groupBy('x=>JSON.stringify({code: x.code, terminal: x.terminal, year: x.year, month: x.month})', null,
                                        function (key, g) {
                                            var r;
                                            key = JSON.parse(key);
                                            r = {
                                                _id: {code: key.code, terminal: key.terminal, year: key.year, month: key.month},
                                                cnt: g.sum("$.cnt"),
                                                total: g.sum("$.tasa"),
                                                totalPeso: g.sum("$.totalTasa"),
                                                totalAgp: g.sum("$.tasaAgp"),
                                                totalPesoAgp: g.sum("$.totalTasaAgp")
                                            };
                                            r.cnt = Math.abs(r.cnt);
                                            return r;
                                        }).toArray();

                                    mp = MatchPrice.find({match: {$in: rates}}, {price: true, match : true});
                                    mp.populate({path: 'price', match: {rate: {$exists: true}}});
                                    mp.exec(function (err, dataMatch) {

                                        mp = Enumerable.from(dataMatch)
                                            .select(function (item) {
                                                return {code: item.match[0], rate: item.price.toObject().rate};
                                            }).toArray();
                                        mp = Enumerable.from(result)
                                            .join(Enumerable.from(mp), '$._id.code', '$.code', function (left, right){
                                                return {
                                                    code : right.code,
                                                    rate: right.rate,
                                                    terminal: left._id.terminal,
                                                    year: left._id.year,
                                                    month: left._id.month,
                                                    ton: left.cnt,
                                                    total: left.total,
                                                    totalPeso: left.totalPeso,
                                                    totalAgp: left.totalAgp,
                                                    totalPesoAgp: left.totalPesoAgp
                                                };
                                            }).toArray();

                                        res.status(200).send({status: 'OK', data : mp});
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    function getRatesYear(req, res) {

        var desde,
            hasta,
            _price,
            _rates,
            cond;

        if (req.query.fechaInicio === undefined || req.query.fechaFin === undefined) {
            res.status(401).send({status: "ERROR", message: "Debe proveer parametros de fecha"});
        } else {
            desde = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
            hasta = moment(req.query.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

            VoucherType.find({type: -1}, function (err, vouchertypes){
                if (err) {
                    res.status(500).send({status: 'ERROR', data : err.message});
                } else {
                    cond = Enumerable.from(vouchertypes)
                        .select(function (item) {
                            if (item.type === -1) {
                                return {$eq: [ "$codTipoComprob", item._id]};
                            }
                        }).toArray();

                    _price = require('../include/price.js');
                    _rates = new _price.price();
                    _rates.ratePrices(function (err, prices) {
                        var invoice,
                            param,
                            rates;

                        rates = Enumerable.from(prices)
                            .select('z=>z.code')
                            .toArray();

                        if (err) {
                            res.status(500).send({status: 'ERROR', data : err.message});
                        } else {
                            param = [
                                { $match : {
                                    'fecha.emision': {$gte: desde, $lt: hasta}
                                }},
                                { $unwind : '$detalle'},
                                { $unwind : '$detalle.items'},
                                { $match : {
                                    'detalle.items.id' : { $in : rates}
                                }},
                                {$project : {
                                    terminal: '$terminal',
                                    code: '$detalle.items.id',
                                    year: {$year: '$fecha.emision'},
                                    cotiMoneda: '$cotiMoneda',
                                    cnt: { $cond: [
                                        {$or : cond },
                                        {$multiply: ['$detalle.items.cnt', -1]},
                                        '$detalle.items.cnt'
                                    ]
                                    },
                                    impUnit: '$detalle.items.impUnit',
                                    impTot: '$detalle.items.impTot'
                                }}];
                            invoice = Invoice.aggregate(param);

                            invoice.exec(function (err, data) {
                                var mp,
                                    result;

                                if (err) {
                                    res.status(500).send({status: 'ERROR', data : err.message});
                                } else {

                                    result = Enumerable.from(data)
                                        .join(Enumerable.from(prices), '$.code', '$.code', function (tasaInvoice, price) {
                                            tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                            tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                            tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                            tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                            tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                            return tasaInvoice;
                                        })
                                        .groupBy('x=>JSON.stringify({code: x.code, terminal: x.terminal, year: x.year})', null,
                                            function (key, g) {
                                                var r;
                                                key = JSON.parse(key);
                                                r = {
                                                    _id: {code: key.code, terminal: key.terminal, year: key.year},
                                                    cnt: g.sum("$.cnt"),
                                                    total: g.sum("$.tasa"),
                                                    totalPeso: g.sum("$.totalTasa"),
                                                    totalAgp: g.sum("$.tasaAgp"),
                                                    totalPesoAgp: g.sum("$.totalTasaAgp")
                                                };
                                                r.cnt = Math.abs(r.cnt);
                                                return r;
                                            }).toArray();

                                    mp = MatchPrice.find({match: {$in: rates}}, {price: true, match : true});
                                    mp.populate({path: 'price', match: {rate: {$exists: true}}});
                                    mp.exec(function (err, dataMatch) {

                                        mp = Enumerable.from(dataMatch)
                                            .select(function (item) {
                                                return {code: item.match[0], rate: item.price.toObject().rate};
                                            }).toArray();
                                        mp = Enumerable.from(result)
                                            .join(Enumerable.from(mp), '$._id.code', '$.code', function (left, right){
                                                return {
                                                    code : right.code,
                                                    rate: right.rate,
                                                    terminal: left._id.terminal,
                                                    year: left._id.year,
                                                    ton: left.cnt,
                                                    total: left.total,
                                                    totalPeso: left.totalPeso,
                                                    totalAgp: left.totalAgp,
                                                    totalPesoAgp: left.totalPesoAgp
                                                };
                                            })
                                            .orderBy('$.year')
                                            .toArray();

                                        res.status(200).send({status: 'OK', data : mp});
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    function getRatesByContainer(req, res) {
        var usr = req.usr,
            paramTerminal = req.params.terminal,
            ter,
            _price,
            _rates,
            sum = {},
            buque,
            viaje,
            jsonParam,
            match;

        ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;

        _price = require('../include/price.js');
        _rates = new _price.price(ter);
        _rates.rates(function (err, rates) {

            if (req.params.currency === 'PES') {
                sum = { $cond: [
                    {$eq: ['$codMoneda', 'PES' ]},
                    '$detalle.items.impTot',
                    {$multiply: ['$detalle.items.impTot', '$cotiMoneda'] }
                ]};
            } else if (req.params.currency === 'DOL') {
                sum = { $cond: [
                    {$eq: ['$codMoneda', 'DOL' ]},
                    '$detalle.items.impTot',
                    {$divide: ['$detalle.items.impTot', '$cotiMoneda'] }
                ]};
            }

            match = {
                terminal: ter,
                'detalle.items.id' : {$in: rates},
                'detalle.contenedor' : req.params.container
            };
            if (req.query.buqueNombre) {
                match['detalle.buque.nombre'] = req.query.buqueNombre;
            }
            if (req.query.viaje) {
                match['detalle.buque.viaje'] = req.query.viaje;
            }

            jsonParam = [
                {   $match: match},
                {$unwind : '$detalle'},
                {$unwind : '$detalle.items'},
                {$match : {
                    'detalle.items.id' : {$in: rates},
                    'detalle.contenedor' : req.params.container
                }},
                {$project : {terminal: 1, 'detalle.items': 1, total : sum }},
                {
                    $group  : {
                        _id: {
                            terminal: '$terminal',
                            id: '$detalle.items.id'
                        },
                        cnt: { $sum: '$detalle.items.cnt'},
                        total: {$sum: '$total'}
                    }
                }
            ];
            Invoice.aggregate(jsonParam, function (err, data) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message });
                } else {
                    res.status(200).send({status: 'OK', data: data });
                }
            });
        });
    }

    function getNoMatches(req, res) {

        var paramTerminal = req.params.terminal,
            skip = parseInt(req.params.skip, 10),
            limit = parseInt(req.params.limit, 10),
            param = [
                {
                    $match: {terminal: paramTerminal }
                },
                {$unwind: '$match'},
                {$project: {match: '$match', _id: 0}}
            ],
            s,
            parametro,
            fecha,
            match = {
                terminal: paramTerminal
            },
            inv;

        s = MatchPrice.aggregate(param);
        s.exec(function (err, noMatches) {
            if (!err) {
                var arrResult = [];
                noMatches.forEach(function (item) {
                    arrResult.push(item.match);
                });

                if (req.query.fechaInicio || req.query.fechaFin) {
                    match["fecha.emision"] = {};
                    if (req.query.fechaInicio) {
                        fecha = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
                        match["fecha.emision"]['$gte'] = fecha;
                    }
                    if (req.query.fechaFin) {
                        fecha = moment(req.query.fechaFin, 'YYYY-MM-DD').toDate();
                        match["fecha.emision"]['$lte'] = fecha;
                    }
                }

                parametro = [
                    { $match: match},
                    { $unwind: "$detalle"},
                    { $unwind: "$detalle.items"},
                    { $project: { code: '$detalle.items.id'}},
                    { $match: {code: {$nin: arrResult}}},
                    { $group: {_id: { _id: "$_id"}}},
                    { $skip : skip},
                    { $limit : limit}
                ];

                inv = Invoice.aggregate(parametro);

                inv.exec(function (err, data) {
                    var ids = [];
                    data.forEach(function (item) {
                        ids.push(item._id._id);
                    });
                    if (!err) {
                        if (data.length > 0) {
                            inv._pipeline.splice(6, 2);
                            inv.group({_id: null, cnt: {$sum: 1}});
                            inv.exec(function (err, data2) {

                                Invoice.find({_id : {$in: ids}}, function (err, invoices){
                                    var cnt = data2[0].cnt,
                                        pageCount = data.length,
                                        result = {
                                            status: 'OK',
                                            totalCount: cnt,
                                            pageCount: (limit > pageCount) ? limit : pageCount,
                                            page: skip,
                                            data: invoices
                                        };
                                    res.status(200).send(result);
                                });

                            });
                        } else {
                            res.status(200).send({ status: 'OK', data: null });
                        }
                    }
                });
            } else {
                log.logger.error('%s', err);
                res.status(500).send({status: 'ERROR', data: err.message});
            }
        });
    }

    function getCorrelative(req, res) {
        var usr = req.usr,
            fecha,
            param = {},
            cashBoxes,
            cashboxExecs,
            contadorFaltantesTotal,
            async;

        log.time("totalTime");

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        if (req.query.fechaInicio || req.query.fechaFin) {
            param["fecha.emision"] = {};
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
                param["fecha.emision"]['$gte'] = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, 'YYYY-MM-DD').toDate();
                param["fecha.emision"]['$lte'] = fecha;
            }
        }
        cashBoxes = [];
        if (req.query.nroPtoVenta) {
            cashBoxes = req.query.nroPtoVenta.split(',');
        } else {
            log.logger.error("El nro de punto de venta no ha sido enviado");
            res.status(403).send({status: "ERROR", data: "El nro de punto de venta no ha sido enviado" });
        }
        if (req.query.codTipoComprob) {
            param.codTipoComprob = parseInt(req.query.codTipoComprob, 10);
        }

        cashboxExecs = [];
        contadorFaltantesTotal = 0;

        cashBoxes.forEach(function (cash) {
            //funcion que calcula la correlatividad por cada caja que sera ejecutada en paralelo async
            var cashboxExec = function (callback) {
                var invoices,
                    logTimeBase;
                param.nroPtoVenta = parseInt(cash, 10);

                invoices = Invoice.find(param, {nroComprob: 1, 'fecha.emision': 1, _id: 0});
                invoices.sort({nroComprob: 1});
                invoices.lean();

                log.time("logTimeBase");
                invoices.exec(function (err, invoicesData) {
                    var fecha,
                        faltantes = [],
                        control = 0,
                        contadorFaltantes = 0,
                        result,
                        dif,
                        item2Add,
                        i,
                        len;

                    if (!err) {
                        invoicesData.forEach(function (invoice) {
                            if (control === 0) {
                                control = invoice.nroComprob;
                            } else {
                                control += 1;
                                if (control !== invoice.nroComprob) {
                                    fecha = moment(invoice.fecha.emision).format("YYYY-MM-DD");
                                    if (invoice.nroComprob - control > 3) {
                                        dif = (invoice.nroComprob) - control;
                                        contadorFaltantes+= dif;
                                        item2Add = util.format('[%d a %d] (%d)', control, (invoice.nroComprob - 1), dif);
                                        faltantes.push({n: item2Add, d: fecha});
                                    } else {
                                        len=invoice.nroComprob;
                                        for (i=control; i<len; i++){
                                            faltantes.push({n: i.toString(), d: fecha});
                                            contadorFaltantes++;
                                        }
                                    }
                                    control = invoice.nroComprob;
                                }
                            }
                        });
                        contadorFaltantesTotal += contadorFaltantes;
                        result = {
                            status: 'OK',
                            nroPtoVenta: cash,
                            totalCount: contadorFaltantes,
                            data: faltantes,
                            time: log.timeEnd("logTimeBase")
                        };
                        //io.sockets.emit('correlative', result);
                        io.sockets.emit('correlative_'+req.query.x, result);
                        return callback(null, result);
                    } else {
                        log.logger.error("%s", err.message);
                        res.status(500).send({status: "ERROR", data: {name: err.name, message: err.message} });
                    }
                });
            };

            cashboxExecs.push(cashboxExec);
        });

        async = require('async');
        async.parallel(cashboxExecs, function (err, results) {
            var response = {
                status: "OK",
                totalCount: contadorFaltantesTotal,
                data: results,
                time: log.timeEnd("totalTime")
            };
            res.status(200).send(response);

        });

    }

    function getCashbox(req, res){
        var usr = req.usr;
        var paramTerminal = req.params.terminal;

        var fecha;

        var ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;
        var param = {terminal:	ter};

        if (req.query.fechaInicio || req.query.fechaFin) {
            param["fecha.emision"] = {};
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
                param["fecha.emision"].$gte = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, 'YYYY-MM-DD').toDate();
                param["fecha.emision"].$lte = fecha;
            }
        }
        if (req.query.nroPtoVenta) {
            param.nroPtoVenta = req.query.nroPtoVenta;
        }
        if (req.query.codTipoComprob) {
            param.codTipoComprob = req.query.codTipoComprob;
        }
        if (req.query.nroComprobante) {
            param.nroComprob = req.query.nroComprobante;
        }
        if (req.query.razonSocial) {
            param.razon = {$regex:req.query.razonSocial};
        }
        if (req.query.documentoCliente) {
            param.nroDoc = req.query.documentoCliente;
        }

        if (req.query.contenedor) {
            param['detalle.contenedor'] = req.query.contenedor;
        }

        if (req.query.buqueNombre) {
            param['detalle.buque.nombre'] = req.query.buqueNombre;
        }

        if (req.query.viaje) {
            param['detalle.buque.viaje'] = req.query.viaje;
        }

        if (req.query.code) {
            param['detalle.items.id'] = req.query.code;
        }

        if (req.query.resend) {
            param.resend = req.query.resend;
        }

        if (req.query.estado){
            var states = req.query.estado.split(",");
            param['$or'] = [
                { estado:{$size: 1, $elemMatch: {estado: {$in: states}, grupo:'ALL'} } },
                { 'estado.1': { $exists: true } , estado: {$elemMatch: {estado: {$in: states}, grupo: usr.group} } }
            ];
        }

        Invoice.distinct('nroPtoVenta', param, function (err, data){
            if (err){
                res.status(500).send({status: 'ERROR', data: err.message});
            } else {
                res.status(200).send({status: 'OK', data: data.sort()});
            }
        });
    }

    function updateInvoice (req, res) {

        var usr = req.usr,
            errMsg;

        var param = {_id: req.params._id, terminal: req.params.terminal};
        Invoice.findOneAndUpdate(param, { $set: req.body}, null, function (err, data) {
            if  (err) {
                errMsg = util.format("%s", err.error);
                log.logger.error(errMsg);
                res.status(500).send({status: "ERROR", message: errMsg});
            } else {
                res.status(200).send({"status": "OK", "data": data})
            }
        });
    }

    function setState (req, res) {
        var usr = req.usr;

        Invoice.update({_id: req.params._id, 'estado.grupo': usr.group},
            {$set: {'estado.$.estado' : req.body.estado}},
            function (err, rowAffected, data){
                if (err) {
                    var errMsg = 'Error en cambio de estado. %s';
                    log.logger.error(errMsg, err.message);
                    res.status(500).send({status:'ERROR', data: 'Error en cambio de estado.'});
                } else  {

                    if (rowAffected === 0){
                        Invoice.findByIdAndUpdate( req.params._id,
                            { $push: { estado: { estado: req.body.estado, grupo: usr.group, user: usr.user } } },
                            {safe: true, upsert: true},
                            function (err, data ){
                                if (err) {
                                    var errMsg = 'Error en cambio de estado. %s';
                                    log.logger.error(errMsg, err.message);
                                    res.status(500).send({status:'ERROR', data: 'Error en cambio de estado.'});
                                } else {
                                    res.status(200).send({status:'OK', data: data});
                                }
                            });
                    } else {
                        res.status(200).send({status:'OK', data: data});
                    }
                }
            });
    }

    function removeInvoices ( req, res){

        Invoice.remove({_id: req.params._id}, function (err){
            if (!err){
                log.logger.info('Invoice Removed %s', req.params._id);
                res.status(200).send({status:'OK', data: "OK"});
            } else {
                res.status(500).send({status:'ERROR', data: "Error al intentar eliminar"});
            }
        });
    }

    function getInvoicesByRates (req, res) {

        var ratesParam = req.body.data,
            param,
            dateIni,
            dateFin;

        if (ratesParam.length<1) {

        } else {

            dateIni = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
            dateFin = moment(req.query.fechaFin, 'YYYY-MM-DD').toDate();

            param = [
                { $match: { code: {$in: ratesParam } } },
                { $unwind: '$match'},
                { $project : {code: '$code',  match: '$match', _id: false}}
            ];
            MatchPrice.aggregate(param, function (err, matchprices) {
                var ids =[];
                matchprices.forEach(function (item){
                    ids.push(item.match);
                });

                param = [
                    {
                        $match : { 'fecha.emision': { $gte: dateIni, $lte: dateFin }  }
                    },
                    {
                        $unwind : '$detalle'
                    },
                    {
                        $unwind : '$detalle.items'
                    },
                    {
                        $match : {
                            'detalle.items.id' : {$in: ids }
                        }
                    },
                    {
                        $group  : {
                            _id: { terminal: '$terminal', code: '$detalle.items.id'},
                            total: { $sum : '$detalle.items.impTot'}
                        }
                    },
                    {
                        $project : { _id:0, terminal: '$_id.terminal', code: '$_id.code', total:1}
                    }
                ];

                var rates = Invoice.aggregate(param);
                rates.exec( function (err, ratesData) {
                    var response,
                        result,
                        result2;

                    if (err){
                        log.logger.error(err);
                        res.status(500).json({status:"ERROR", data: err.message});
                    }
                    else {
                        response = Enumerable.from(ratesData)
                            .join(Enumerable.from(matchprices), '$.code', '$.match', function (rate, matchprice){
                                rate.code = matchprice.code;
                                return rate;
                            }).toArray();
                        result = Enumerable.from(response).groupBy("{code: $.code, terminal: $.terminal}", null,
                            function (key, g) {
                                var result = {
                                    terminal: key.terminal
                                };
                                result[key.code] = g.sum("$.total");
                                return result;
                            }).toArray();

                        result2 = Enumerable.from(result).groupBy("$.terminal" , null,
                            function (key, g) {
                                var prop = g.getSource();
                                var ter = {terminal: key, data: {}};
                                prop.forEach(function (item){
                                    for (var pro in item){
                                        if (pro !== 'terminal')
                                            ter.data[pro]= item[pro];
                                    }
                                });
                                return (ter);
                            }).toArray();
                        res.status(200).json({status:'OK', data: result2});
                    }
                });
            });
        }

    }

    function getDistincts( req, res) {
        var usr = req.usr,
            distinct = '',
            param = {};
        var Invoice = require('../lib/invoice2.js');

        if (req.route.path === '/:terminal/ships') {
            distinct = 'detalle.buque.nombre';
        }

        if (req.route.path === '/:terminal/clients') {
            distinct = 'razon';
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        Invoice = new Invoice();

        if (distinct !== '') {
            Invoice.getDistinct(distinct, param, function (err, data) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(data);
                }
            });
        } else {
            res.status(400).send({status: 'ERROR', message: 'El ruta es inválida', data: []});
        }
    }

    function getShipTrips (req, res) {
        var usr = req.usr;
        var paramTerminal = req.params.terminal;

        var ter = (usr.role === 'agp')?paramTerminal:usr.terminal;
        var param = {terminal: ter, 'detalle.buque.nombre': {$ne: null}};

        Invoice.aggregate([
            { $match: param },
            { $unwind : '$detalle'},
            { $group: {_id: {buque: '$detalle.buque.nombre', viaje: '$detalle.buque.viaje', fecha: '$detalle.buque.fecha'} } },
            { $sort: { '_id.buque': 1, '_id.viaje': 1} },
            { $project : {buque: '$_id.buque', viaje: '$_id.viaje', fecha: '$_id.fecha', _id:false}}
        ], function (err, data){
            var Enumerable,
                resultTer;
            if (err) {
                res.status(500).json({status: 'ERROR', data: err.message});
            } else {
                Enumerable = require('linq');
                resultTer = Enumerable.from(data)
                    .groupBy("$.buque" , null,
                    function (key, g) {
                        var prop = g.getSource();
                        var ter = {buque: key, viajes: []};
                        prop.forEach(function (item){
                            var viaje = {
                                viaje : item.viaje,
                                fecha : item.fecha
                            }
                            ter.viajes.push(viaje);
                            //for (var pro in item){
                            //    if (pro !== 'buque')
                            //        ter.viajes.push(item[pro]);
                            //}
                        });
                        return (ter);
                    }).toArray();

                if (oracle.pool) {
                    oracle.pool.getConnection(function (err, connection) {
                        var strSql;
                        if (err) {
                            console.log("%s, Error en Oracle getShipTrips.", new Date());
                            res.status(200).send({status: 'OK', data: resultTer});
                        } else {

                            strSql = "select nombrebuque buque, fechaarribo fecha, count(*) cnt " +
                                "	from registro1_sumimpomani " +
                                "	group by nombrebuque, fechaarribo " +
                                "	order by nombrebuque,fechaarribo";

                            connection.execute(strSql, [], function (err, dataOra) {
                                var dataQ;
                                if (err) {
                                    oracle.doRelease(connection);
                                    res.status(500).send({status: 'ERROR', data: err});
                                } else {
                                    oracle.doRelease(connection);
                                    dataOra = Enumerable.from(dataOra.rows).select(function (item) {
                                        return {"buque": item.BUQUE, fecha: item.FECHA};
                                    }).toArray();
                                    dataQ = Enumerable.from(resultTer).groupJoin(dataOra, '$.buque', '$.buque', function (item, g) {
                                        var both = false;
                                        if (g.getSource !== undefined)
                                            both = true;
                                        return {
                                            buque: item.buque,
                                            viajes: item.viajes,
                                            both: both
                                        };
                                    }).toArray();

                                    res.status(200).send({status: 'OK', data: dataQ});

                                }
                            });
                        }
                    });
                } else {
                    console.log("%s, Error en Oracle getShipTrips.", new Date());
                    res.status(200).send({status: 'OK', data: resultTer});
                }

            }
        });
    }

    function getShipContainers (req, res) {
        var usr = req.usr,
            paramTerminal,
            ter,
            param,
            buque,
            viaje,
            query,
            price,
            rates;

        price = require('../include/price.js');

        log.startElapsed();

        paramTerminal = req.params.terminal;

        ter = (usr.role === 'agp')?paramTerminal:usr.terminal;

        rates = new price.price(ter);

        buque = req.query.buqueNombre;
        viaje = req.query.viaje;
        param = {terminal:	ter, 'detalle.buque.nombre': buque};

        rates.rates(function (err, ratesArray) {

            query = [
                { $match: param },
                { $unwind : '$detalle'},
                { $match: {'detalle.buque.nombre': buque}},
                { $unwind : '$detalle.items'},
                { $match: {"detalle.buque.viaje" : viaje, 'detalle.items.id': {$in: ratesArray } } },
                { $group: {_id: {buque: '$detalle.buque.nombre', viaje: "$detalle.buque.viaje", contenedor: '$detalle.contenedor' }, tonelada: {$sum: '$detalle.items.cnt'} } },
                { $project: {contenedor: '$_id.contenedor', toneladas: '$tonelada', _id: false}},
                { $sort: {contenedor: 1} }
            ];

            Invoice.aggregate(query , function (err, dataContainers) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    Gate.find({buque: buque, viaje: viaje}, function (err, dataGates) {
                        var Enumerable,
                            response;

                        if (err) {
                            res.status(500).send({status: 'ERROR', data: err.message});
                        } else {
                            Enumerable = require('linq');

                            response = Enumerable.from(dataContainers)
                                .groupJoin(dataGates, '$.contenedor', '$.contenedor', function (inner,outer) {
                                    var result = {
                                        contenedor:'',
                                        gates: []
                                    };
                                    if (outer.getSource !== undefined) {
                                        result.gates =outer.getSource();
                                    }

                                    result.contenedor = inner;
                                    return result;
                                }).toArray();

                            res.status(200)
                                .send({
                                    status: 'OK',
                                    elapsed: log.getElapsed(),
                                    data: response});
                        }
                    });
                }
            });

        });

    }

    function getContainersNoRates (req, res) {

        var paramTerminal = req.params.terminal,
            Invoice = require('../lib/invoice2.js');
        paramTotal,
            fecha;

        _rates.rates(function (err, rates){

            var param = {
                    terminal : paramTerminal,
                    codTipoComprob : 1
                },
                fecha='';

            if (req.query.razonSocial) {
                param.razon = {$regex:req.query.razonSocial}
            }

            paramTotal = [
                { $match: param },
                { $project : {'detalle.items.id': 1, 'detalle.contenedor': 1, _id: 0}},
                { $unwind: '$detalle' },
                { $unwind: '$detalle.items' },
                { $match : {'detalle.items.id' : {$in: rates }}},
                { $project : {contenedor : '$detalle.contenedor'} }
            ];

            inv = Invoice.aggregate(paramTotal);
            inv.exec(function (err, data1){
                //Solo filtra fecha de este lado, en el aggregate trae todas las tasas a las cargas de contenedor históricas.
                if (req.query.fechaInicio || req.query.fechaFin) {
                    param["fecha.emision"] = {};
                    if (req.query.fechaInicio) {
                        fecha = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
                        param["fecha.emision"]['$gte'] = fecha;
                    }
                    if (req.query.fechaFin) {
                        fecha = moment(req.query.fechaFin, 'YYYY-MM-DD').toDate();
                        param["fecha.emision"]['$lte'] = fecha;
                    }
                }

                if (req.query.buqueNombre) {
                    param['detalle.buque.nombre'] = req.query.buqueNombre;
                }
                if (req.query.viaje) {
                    param['detalle.buque.viaje'] = req.query.viaje;
                }

                Invoice.distinct('detalle.contenedor', param, function (err, data2){

                    var contes = Enumerable.from(data1).select('$.contenedor');
                    var contDist = Enumerable.from(data2);

                    var dife = contDist.except(contes)
                        .orderBy()
                        .select(function (item){
                            return {contenedor: {contenedor: item}};})
                        .toArray();

                    res.status(200).json({status: 'OK', totalCount: dife.length, data: dife});
                });

            });
        });
    }

    function getTotals (req, res) {
        var usr = req.usr,
            paramTerminal = req.query.terminal,
            fechaInicio = moment(moment("2013-01-01").format('YYYY-MM-DD')).toDate(),
            fechaFin = moment(moment().format('YYYY-MM-DD')).toDate(),
            clients,
            inv = require('../lib/invoice.js');

        inv = new inv(paramTerminal);

        if (req.query.fechaInicio) {
            fechaInicio = moment(req.query.fechaInicio, ['YYYY-MM-DD']).toDate();
        }
        if (req.query.fechaFin) {
            fechaFin = moment(req.query.fechaFin, ['YYYY-MM-DD']).toDate();
        }
        if (req.query.clients) {
            clients = req.query.clients;
            inv.getTotalByClient(clients, fechaInicio, fechaFin, function (err, data) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(data);
                }
            });
        } else {
            if (req.query.top) {
                inv.getTotalByClientTop(req.query.top, fechaInicio, fechaFin, function (err, data) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(data);
                    }
                });
            }
        }
    }
    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.param('terminal', function (req, res, next, terminal) {
        var usr = req.usr,
            errMsg;

        if (usr.terminal !== 'AGP' && usr.terminal !== terminal) {
            errMsg = util.format('%s', 'La terminal recibida por parámetro es inválida para el token.');
            log.logger.error(errMsg);
            res.status(500).send({status: 'ERROR', data: errMsg});
        } else {
            next();
        }
    });

    router.get('/:terminal/down', getInvoices);
    router.get('/:terminal/:skip/:limit', getInvoices);
    router.get('/invoice/:id', getInvoice);
    router.get('/counts', getCounts);
    router.get('/countsByDate', getCountByDate);
    router.get('/countsByMonth', getCountByMonth);
    router.get('/noRates/:terminal/:skip/:limit', getNoRates);
    router.get('/ratesTotal/:currency', getRatesTotal);
    router.get('/rates', getRatesLiquidacion);
    router.get('/rates/date', getRatesDate);
    router.get('/rates/month', getRatesMonth);
    router.get('/rates/year', getRatesYear);
    router.get('/rates/:terminal/:container/:currency', getRatesByContainer);
    router.get('/noMatches/:terminal/:skip/:limit', getNoMatches);
    router.get('/correlative/:terminal', getCorrelative);
    router.get('/cashbox/:terminal', getCashbox);
    router.put('/invoice/:terminal/:_id', updateInvoice);
    router.put('/setState/:terminal/:_id', setState);
    router.delete('/:_id', removeInvoices);
    router.get('/:terminal/ships', getDistincts);
    router.get('/:terminal/containers', getDistincts);
    router.get('/:terminal/clients', getDistincts);
    router.get('/:terminal/shipTrips', getShipTrips);
    router.get('/:terminal/shipContainers', getShipContainers);
    router.post('/byRates', getInvoicesByRates);
    router.get('/containersNoRates/:terminal', getContainersNoRates);
    router.get('/totalClient', getTotals);
    router.get('/totalClientTop', getTotals);

//	app.get('/invoices/log/:seconds', function( req, res) {
//		logInvoiceBody = 1;
//		log.logger.info("Loguear invoiceBody en insert Habilitado.")
//
//		setTimeout(function(){
//			log.logger.info("Loguear invoiceBody en insert Deshabilitado.")
//			logInvoiceBody = 0;
//		}, req.params.seconds);
//
//		res.status(200).send();
//	})

    return router;
};