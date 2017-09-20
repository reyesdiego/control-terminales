/**
 * Created by Diego Reyes on 2/18/14.
 */
module.exports = (log, oracle) => {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require('util'),        moment = require('moment');

    var MatchPrice = require('../lib/matchPrice2.js');
    MatchPrice = new MatchPrice(oracle);

    let getMatchPrices = (req, res) => {

        var param = {
            terminal: req.params.terminal,
            user: req.usr,
            code: req.query.code,
            onlyRates: req.query.onlyRates,
            onlyMedida: req.query.onlyMedida,
            onlyNorma: req.query.onlyNorma
        };

        log.time("getMatchPrices");
        MatchPrice.getMatchPrices(param)
            .then(data => {
                var response;

                if (req.query.output === 'csv') {
                    response = "CODIGO|PRECIO|FECHA|DESCRIPCION|ASOCIADO\n";

                    data.data.forEach(item => {
                        let matches = '';
                        if (item.matches !== undefined && item.matches !== null) {
                            if (item.matches.match.length > 0) {
                                item.matches.match.forEach(i => (matches += i.code + '-'));
                                matches = matches.substr(0, matches.length - 1);
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
                            item.description.split("\n").join(" ") +
                            "|" +
                            matches +
                            "\n";
                    });
                    res.header('content-type', 'text/csv');
                    res.header('content-disposition', 'attachment; filename=report.csv');
                    res.status(200).send(response);
                } else {
                    data.time = log.timeEnd("getMatchPrices");
                    res.status(200).send(data);
                }
            })
            .catch(err => {
                res.status(500).send(err);
            });

    };

    function getMatchPricesPrice (req, res) {

            var usr = req.usr,
                param = {
                    terminal: (usr.role === 'agp') ? req.params.terminal : usr.terminal
                };

        if (req.query.code) {
            param.code = req.query.code;
        }

        if (req.query.onlyRates) {
            if (req.query.onlyRates !== false) {
                param.rate = true;
            }
        }
        MatchPrice.getPricesTerminal(param)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
            });
    }

    function getMatches(req, res) {
        var params = {};

        params.terminal = req.params.terminal;

        if (req.query.type) {
            params.type = req.query.type;
        }
        MatchPrice.getMatches(params)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    }

    function getNoMatches (req, res) {
        var params = {
            terminal: req.params.terminal,
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin,
            code: req.query.code,
            razonSocial: req.query.razonSocial
        };
        log.time('matchPrice - getNoMatches');
        MatchPrice.getNoMatches(params)
        .then(data => {
                log.timeEnd('matchPrice - getNoMatches');
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
            });
    }

    function addMatchPrice (req, res) {

        var params = {
            price: req.body._idPrice,
            terminal: req.body.terminal,
            code: req.body.match[0]
        };

        MatchPrice.add(params)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
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