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
        config = require('../config/config.js'),
        price = require('../models/price.js');

    function getPrices(req, res) {
        let Price = require('../lib/price.js');

        var usr = req.usr,
            paramTerminal = req.params.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal,
            param = {};

        param.code = req.query.code;
        param.onlyRates = req.query.onlyRates;

        let price = new Price(ter);

        price.getPrices(param, function (err, data) {
            if (err) {
                log.logger.error('Error: %s', err.message);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getPrice(req, res) {
        var Price = require('../lib/price.js'),
            price;
        var usr = req.usr,
            paramTerminal = req.params.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal,

        price = new Price(ter, oracle);
        price.getPrice(req.params.id, function (err, data) {
            if (err) {
                log.logger.error('Error: %s', err.message);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getRates(req, res) {
        var Price = require('../lib/price.js');
        Price = new Price();
        Price.getRates(function (err, data) {
            if (err) {
                log.logger.error('Error: %s', err.message);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getRates2(req, res) {
        var price;

        if (req.usr.terminal !== 'AGP') {
            res.status(403).send({status: "ERROR", data: "No posee permisos para acceder a estos datos."});
            return;
        }
        price = require('../lib/price.js');
        price = new price();
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

        var Price = require('../lib/price.js');
        Price = new Price(req.body.terminal, oracle);

        try {
            if (req.body.topPrices === undefined || req.body.topPrices.length < 1) {
                res.status(403).send({status: "ERROR", data: "Debe proveer un precio válido."});
                return;
            }
            req.body.topPrices.forEach(item => {
                item.from = moment(item.from, "YYYY-MM-DD").toDate();
            });

            if (req.method === 'POST') {

                var param = {
                    terminal: req.body.terminal,
                    code: req.body.code.toUpperCase(),
                    description: req.body.description,
                    unit: req.body.unit,
                    topPrices: req.body.topPrices,
                    matches: null
                };

                Price.add(param)
                    .then(priceAdded => {
                        log.logger.insert("Price INS:%s - %s", priceAdded.data._id, priceAdded.data.terminal);

                        Account.findEmailToApp('price', function (err, emails) {
                            var strSubject,
                                mailer,
                                to;

                            if (!err) {
                                if (emails.data.length > 0) {
                                    res.render('priceAdd.jade', {code: priceAdded.data.code, description: priceAdded.data.description, terminal: usr.terminal, price: priceAdded.data.topPrices[0].price}, function (err, html) {
                                        html = {
                                            data : html,
                                            alternative: true
                                        };
                                        strSubject = util.format("AGP - %s - Tarifa Nueva", usr.terminal);
                                        mailer = new mail.mail(config.email);
                                        to = emails.data;
                                        mailer.send(to, strSubject, html);
                                    });
                                }
                            }
                        });

                        res.status(200).send(priceAdded);
                    })
                    .catch(err =>  {
                        log.logger.error(err.message);
                        res.status(500).send(err);
                    });
            } else {

                var params = {
                    _id: req.params.id,
                    description: req.body.description,
                    code: req.body.code,
                    topPrices: req.body.topPrices,
                    unit: req.body.unit
                }
                Price.update(params).
                    then(data => {
                        log.logger.update("Price UPD:%s - %s", data.data._id, usr.terminal);
                        res.status(200).send(data);
                    })
                .catch(err => {
                        log.logger.error('Error: %s - %s', err.message, usr.terminal);
                        res.status(500).send(err);
                    });
            }
        } catch (error) {
            res.status(500).send({"status": "ERROR", "data": "Error en addPrice " + error.message});
        }
    }

    function deletePrice(req, res) {
        var usr = req.usr;
        var Price = require('../lib/price.js'),
            price;
        var paramTerminal = req.params.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal;

        price = new Price(ter);

        price.delete(req.params.id)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(403).send(err);
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