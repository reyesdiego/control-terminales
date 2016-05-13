/**
 * Created by Diego Reyes on 2/18/14.
 */
module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        MatchPrice = require('../models/matchPrice.js'),
        Invoice = require('../models/invoice.js'),
        util = require('util'),
        Price = require('../models/price.js'),
        moment = require('moment');

    function getMatchPrices(req, res) {
        var usr = req.usr;

        var paramTerminal = req.params.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal,
            param = {
                $or : [
                    {terminal: "AGP"},
                    {terminal: ter}
                ]
            };

        if (req.query.code) {
            param.code = req.query.code;
        }

        if (req.query.onlyRates) {
            if (req.query.onlyRates !== false) {
                param.rate = {$exists: true};
            }
        }

        Price.find(param /*{topPrices : {$slice: -1}}*/ )
            .populate({path: 'matches', match: {"terminal": paramTerminal}})
            .sort({terminal: 1, code: 1})
            .lean()
            .exec(function (err, prices) {
                var response;
                if (err) {
                    log.logger.error('Error: %s', err.message);
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {

                    if (req.query.output === 'csv') {
                        response = "CODIGO|PRECIO|FECHA|UNIDAD|ASOCIADO|DESCRIPCION\n";

                        prices.forEach(function (item) {
                            let matches = '';
                            if (item.matches !== undefined && item.matches !== null && item.matches.length > 0) {
                                if (item.matches[0].match.length > 0) {
                                    matches = item.matches[0].match.join('-').toString();
                                } else {
                                    matches = "";
                                }
                            }
                            response = response +
                                item.code +
                                "|" +
                                item.topPrices[0].price +
                                "|" +
                                moment(item.topPrices[0].from).format("YYYY-MM-DD") +
                                "|" +
                                item.unit +
                                "|" +
                                matches +
                                "|" +
                                item.description.split("\n").join(" ") +
                                "\n";
                        });
                        res.header('content-type', 'text/csv');
                        res.header('content-disposition', 'attachment; filename=report.csv');
                        res.status(200).send(response);
                    } else {
                        res.status(200).send({
                            status: 'OK',
                            totalCount: prices.length,
                            data: prices
                        });
                    }

                }
            });
    }

    function getMatchPricesPrice (req, res) {

        var matchPrice = require('../lib/matchPrice.js'),
            usr = req.usr,
            ter = (usr.role === 'agp') ? req.params.terminal : usr.terminal,
            param = {};

        matchPrice = new matchPrice(ter);

        if (req.query.code) {
            param.code = req.query.code;
        }

        if (req.query.onlyRates) {
            if (req.query.onlyRates !== false) {
                param.rate = true;
            }
        }
        matchPrice.getPricesTerminal(param, function (err, result) {
            if (err) {
                res.status(500).send({status: "ERROR", data: err.message});
            } else {
                res.status(200).send(result);
            }
        });

    }

    function getMatches(req, res) {
        var matchPrice = require('../lib/matchPrice.js');
        var params = {};

        params.terminal = req.params.terminal;

        matchPrice = new matchPrice(params.terminal);

        if (req.query.type) {
            params.type = req.query.type;
        }
        matchPrice.getMatches(params, function (err, data) {
            if (err) {
                res.status(200).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getNoMatches (req, res) {
        var usr = req.usr,
            paramTerminal = req.params.terminal,
            param = [
                {
                    $match: {terminal: paramTerminal }
                },
                { $unwind: '$match' },
                { $project: {match: '$match', _id: 0}}
            ],
            s = MatchPrice.aggregate(param);

        s.exec(function (err, noMatches) {
            var arrNoMatches = [],
                fecha,
                param = {},
                parametro;

            if (!err) {
                noMatches.forEach(function (item) {
                    arrNoMatches.push(item.match);
                });

                if (req.query.fechaInicio || req.query.fechaFin) {
                    param["fecha.emision"] = {};
                    if (req.query.fechaInicio) {
                        fecha = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
                        param["fecha.emision"]["$gte"] = fecha;
                    }
                    if (req.query.fechaFin) {
                        fecha = moment(req.query.fechaFin, 'YYYY-MM-DD').toDate();
                        param["fecha.emision"]['$lte'] = fecha;
                    }
                }
                param.terminal = paramTerminal;
                parametro = [
                    { $match: param},
                    { $unwind: '$detalle'},
                    { $unwind: '$detalle.items'},
                    { $match: {'detalle.items.id' : {$nin: arrNoMatches } } },
                    { $group: {
                        _id: {
                            code : '$detalle.items.id'
                        }
                    }},
                    {$sort: {'_id.code': 1}}
                ];
                Invoice.aggregate(parametro, function (err, data) {
                    var result = [];
                    data.forEach(function (item) {
                        result.push(item._id.code);
                    });

                    res.status(200)
                        .send({
                            status: 'OK',
                            totalCount: result.length,
                            data: result
                        });
                });
            }
        });
    }

    function addMatchPrice (req, res) {

        var async = require('async'),
            matches = req.body;

        async.forEachSeries(matches, function(match, asyncCallback) {

            Price.findOne({_id: match._idPrice}, function (err, priceItem) {
                var _matchPrice2Add;

                if (!err && priceItem) {
                    if (match._id !== undefined && match._id !== null) {
                        MatchPrice.findOne({_id: match._id}, function (err, matchItem) {
                            matchItem.match = match.match;
                            matchItem.save(function (err) {
                                asyncCallback();
                            });
                        });
                    } else {
                        _matchPrice2Add = {
                            terminal: match.terminal,
                            code: match.code,
                            match: match.match,
                            price: match._idPrice
                        };
                        _matchPrice2Add = new MatchPrice(_matchPrice2Add);
                        _matchPrice2Add.save(function (err, data) {
                            if (priceItem.matches === null) {
                                priceItem.matches = [];
                            }
                            priceItem.matches.push(data._id);
                            priceItem.save();
                            asyncCallback();
                        });
                    }
                }
            });
        }, function (err) {
            res.status(200).send({status: "OK", data: {matches: matches.length}});
        });

    }

    /*
    router.use(function timeLog(req, res, next){
        log.logger.info('Time: %s', Date.now());
        next();
    });
    */
    router.get('/:terminal', getMatchPrices);
    router.get('/price/:terminal', getMatchPricesPrice);
    router.get('/matches/:terminal', getMatches);
    router.get('/matches/all', getMatches);
    router.get('/noMatches/:terminal', getNoMatches);
    router.post('/matchprice', addMatchPrice);
    router.put('/matchprice', addMatchPrice);

    return router;

};