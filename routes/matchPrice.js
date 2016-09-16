/**
 * Created by Diego Reyes on 2/18/14.
 */
module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        MatchPrice = require('../models/matchPrice.js'),
        util = require('util'),
        Price = require('../models/price.js'),
        moment = require('moment');

    function getMatchPrices(req, res) {
        var MatchPrice2 = require('../lib/matchPrice2.js');
        MatchPrice2 = new MatchPrice2(oracle);

        var param = {
            terminal: req.params.terminal,
            user: req.usr,
            code: req.query.code,
            onlyRates: req.query.onlyRates
        };

        MatchPrice2.getMatchPrices(param)
        .then(data => {
                var response;

                if (req.query.output === 'csv') {
                    response = "CODIGO|PRECIO|FECHA|UNIDAD|ASOCIADO|DESCRIPCION\n";

                    data.data.forEach(item => {
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
                            item.price +
                            "|" +
                            moment(item.from).format("YYYY-MM-DD") +
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
                    res.status(200).send(data);
                }
            })
        .catch(err => {
                res.status(500).send(err);
            });

    }

    function getMatchPricesPrice (req, res) {

        var matchPrice = require('../lib/matchPrice2.js'),
            usr = req.usr,
            param = {
                terminal: (usr.role === 'agp') ? req.params.terminal : usr.terminal
            };

        matchPrice = new matchPrice(oracle);

        if (req.query.code) {
            param.code = req.query.code;
        }

        if (req.query.onlyRates) {
            if (req.query.onlyRates !== false) {
                param.rate = true;
            }
        }
        matchPrice.getPricesTerminal(param)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
            });
    }

    function getMatches(req, res) {
        var matchPrice = require('../lib/matchPrice2.js');
        var params = {};

        params.terminal = req.params.terminal;

        matchPrice = new matchPrice();

        if (req.query.type) {
            params.type = req.query.type;
        }
        matchPrice.getMatches(params)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    }

    function getNoMatches (req, res) {

        var MatchPrice = require('../lib/matchPrice2.js');
        MatchPrice = new MatchPrice(oracle);

        var params = {
            terminal: req.params.terminal,
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin
        };
        MatchPrice.getNoMatches(params)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
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
                } else {
                    asyncCallback();
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