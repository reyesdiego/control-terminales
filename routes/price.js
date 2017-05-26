/**
 * Created by Administrator on 1/10/14.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require('util'),
        moment = require('moment'),
        mail = require("../include/emailjs"),
        config = require('../config/config.js');

    var Price = require('../lib/price.js');

    function getPrices(req, res) {

        var usr = req.usr,
            paramTerminal = req.params.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal,
            param = {};

        param.code = req.query.code;
        param.onlyRates = req.query.onlyRates;

        let price = new Price(ter, oracle);

        price.getPrices(param)
            .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                log.logger.error('Error: %s', err.message);
                res.status(500).send(err);
            });
    }

    function getPrice(req, res) {

        var usr = req.usr,
            paramTerminal = req.params.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;

        let price = new Price(ter, oracle);
        price.getPrice(req.params.id)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error('Error: %s', err.message);
                res.status(500).send(err);
            });
    }

    function getRates(req, res) {

        let price = new Price(oracle);
        price.getRates(function (err, data) {
            if (err) {
                log.logger.error('Error: %s', err.message);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getRates2(req, res) {

        if (req.usr.terminal !== 'AGP') {
            res.status(403).send({status: "ERROR", data: "No posee permisos para acceder a estos datos."});
            return;
        }
        let price = new Price(oracle);
        price.rates(true, function (err, data) {
            if (err) {
                res.status(500).send({status: "ERROR", message: err.message});
            } else {
                res.status(200).send(data);
            }
        });

    }

    function addPrice(req, res) {
        var usr = req.usr,
            Account = require('../models/account');
        var paramTerminal = usr.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;

        try {
            if (req.body.topPrices === undefined || req.body.topPrices.length < 1) {
                res.status(400).send({status: "ERROR", data: "Debe proveer un precio válido."});
                return;
            }
            req.body.topPrices.forEach(item => {
                item.from = moment(item.from, "YYYY-MM-DD").toDate();
            });

            var priceORA = new Price(ter, oracle);
            var priceMongo = new Price(ter);

            if (req.method === 'POST') {

                let param = {
                    terminal: req.body.terminal,
                    code: req.body.code.toUpperCase(),
                    description: req.body.description,
                    unit: req.body.unit,
                    largo: req.body.largo,
                    norma: req.body.norma,
                    topPrices: req.body.topPrices,
                    matches: req.body.matches,
                    usr: usr
                };
                //Price Oracle
                priceORA.add(param)
                    .then(priceAdded => {
                        log.logger.insert("Price ORA INS:%s - %s - %s", priceAdded.data._id, priceAdded.data.terminal, priceAdded.data.code);
                        Account.findEmailToApp('price')
                            .then(emails => {
                                var strSubject,
                                    mailer,
                                    to;
                                if (emails.data.length > 0) {
                                    res.render('priceAdd.jade', {
                                            titulo: "Ha sido dada de alta una nueva Tarifa o Servicio",
                                            code: priceAdded.data.code,
                                            description: priceAdded.data.description,
                                            terminal: usr.terminal,
                                            price: priceAdded.data.topPrices[0].price,
                                            asociados: priceAdded.data.matches.match
                                        },
                                        (err, html) => {
                                            html = {
                                                data : html,
                                                alternative: true
                                            };
                                            strSubject = util.format("AGP - %s - Tarifa Nueva", usr.terminal);
                                            mailer = new mail.mail(config.email);
                                            to = emails.data;
                                            mailer.send(to, strSubject, html, (err, data) => {
                                                log.logger.insert("Price INS MailTo:%s", to.join('-'));
                                            });
                                    });
                                }
                            })
                            .catch(err => {
                                console.log(err);
                            });

                        res.status(200).send(priceAdded);
                    })
                    .catch(err =>  {
                        log.logger.error("Price ORA INS:%s ", err.message);
                        res.status(500).send(err);
                    });

                //Price MongoDB
                priceMongo.add(param)
                    .then(priceAdded => {
                        log.logger.insert("Price MongoDb INS:%s - %s", priceAdded.data._id, priceAdded.data.terminal);
                    })
                    .catch(err =>  {
                        log.logger.error("Price MongoDb INS %s", err.message);
                    });

            } else {

                /**Price Oracle Update */
                priceORA.getPrice(req.body._id)
                    .then(price => {

                        let param = {
                            _id: req.body._id,
                            terminal: req.body.terminal,
                            code: req.body.code.toUpperCase(),
                            description: req.body.description,
                            unit: req.body.unit,
                            largo: req.body.largo,
                            norma: req.body.norma,
                            topPrices: req.body.topPrices,
                            matches: req.body.matches,
                            usr: usr
                        };

                        /** Se hace operacion de Update en OracleDB **/
                        priceORA.update(param)
                            .then(priceUpdated => {
                                let Enumerable = require("linq");
                                log.logger.update("Price ORA UPD:%s - %s", req.body._id, usr.terminal);

                                if (Enumerable.from(priceUpdated.data.matches.match).contains(true, "$.new")) {
                                    Account.findEmailToApp('price')
                                        .then(emails => {
                                            var strSubject,
                                                mailer,
                                                to;
                                            if (emails.data.length > 0) {
                                                res.render('priceAdd.jade', {
                                                        titulo: "Ha sido modificada una Tarifa o Servicio",
                                                        code: priceUpdated.data.code,
                                                        description: priceUpdated.data.description,
                                                        terminal: usr.terminal,
                                                        price: priceUpdated.data.topPrices[0].price,
                                                        asociados: priceUpdated.data.matches.match
                                                    },
                                                    (err, html) => {
                                                        html = {
                                                            data : html,
                                                            alternative: true
                                                        };
                                                        strSubject = util.format("AGP - %s - Tarifa Nueva", usr.terminal);
                                                        mailer = new mail.mail(config.email);
                                                        to = emails.data;
                                                        mailer.send(to, strSubject, html, (err, data) => {
                                                            log.logger.insert("Price UPDATE MailTo:%s", to.join('-'));
                                                        });
                                                    });
                                            }
                                        })
                                        .catch(err => {
                                            console.log(err);
                                        });
                                }

                                res.status(200).send(priceUpdated);
                            })
                            .catch(err => {
                                log.logger.error('Error Price ORA UPD: %s - %s', err.message, usr.terminal);
                                res.status(500).send(err);
                            });

                        /** Se hace la misma operacion de Update en Mongodb **/
                        price = price.data;
                        //Price MongoDB
                        priceMongo.getPrices({code: price.code, terminal: ter})
                            .then(prices => {

                                prices = prices.data;
                                if (prices.length > 0) {
                                    let param = {
                                        _id: prices[0]._id,
                                        terminal: req.body.terminal,
                                        code: req.body.code.toUpperCase(),
                                        description: req.body.description,
                                        unit: req.body.unit,
                                        largo: req.body.largo,
                                        norma: req.body.norma,
                                        topPrices: req.body.topPrices,
                                        matches: req.body.matches,
                                        usr: usr
                                    };
                                    priceMongo.update(param)
                                        .then(data => {
                                            log.logger.update("Price UPD:%s - %s", data.data._id, usr.terminal);
                                        })
                                        .catch(err => {
                                            log.logger.error('Error: %s - %s', err.message, usr.terminal);
                                        });
                                }});
                    });
            }
        } catch (error) {
            res.status(500).send({"status": "ERROR", "data": "Error en addPrice " + error.message});
        }
    }

    function deletePrice(req, res) {
        var usr = req.usr;

        var paramTerminal = usr.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;

        let priceORA = new Price(ter, oracle);

        priceORA.getPrice(req.params.id)
        .then(price => {
                price = price.data;
                priceORA.delete(price._id)
                    .then(data => {
                        log.logger.info("Price ORA DEL:%s", price._id);
                        res.status(200).send(data);
                    })
                    .catch(err => {
                        res.status(400).send(err);
                    });

                let priceMongo = new Price(ter);
                priceMongo.getPrices({code: price.code, terminal: ter})
                .then(prices => {
                        prices = prices.data;
                        if (prices.length > 0) {
                            priceMongo.delete(prices[0]._id)
                                .then(data => {
                                    log.logger.info("Price DEL:%s", req.params.id);
                                })
                                .catch(err => {
                                });
                        }
                    });

            })
        .catch(err => {
                res.status(400).send(err);
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

    router.get('/:terminal', getPrices);
    router.get('/:id/:terminal', getPrice);
    router.get('/rates/1/codes', getRates);
    router.get('/rates/1/all', getRates2);
    router.post('/price', addPrice);
    router.put('/price/:id', addPrice);
    router.delete('/price/:id', deletePrice);

    return router;

};