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

        price = new Price(ter);
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
            _price,
            Account = require('../models/account');

        try {
            if (req.body.topPrices === undefined || req.body.topPrices.length < 1) {
                res.status(403).send({status: "ERROR", data: "Debe proveer un precio válido."});
                return;
            }
            req.body.topPrices.forEach(function (item) {
                item.from = moment(item.from, "YYYY-MM-DD").toDate();
            });

            if (req.method === 'POST') {
                _price = new price({
                    terminal: req.body.terminal,
                    code: req.body.code.toUpperCase(),
                    description: req.body.description,
                    unit: req.body.unit,
                    topPrices: req.body.topPrices,
                    matches: null
                });
                _price.save(function (errSave, priceAdded) {
                    if (!errSave) {
                        log.logger.insert("Price INS:%s - %s", priceAdded._id, usr.terminal);

                        Account.findEmailToApp('price', function (err, emails) {
                            var strSubject,
                                mailer,
                                to;

                            if (!err) {

                                if (emails.data.length > 0) {
                                    res.render('priceAdd.jade', {code: priceAdded.code, description: priceAdded.description, terminal: usr.terminal, price: priceAdded.topPrices[0].price}, function (err, html) {
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

                        res.status(200).send({"status": "OK", "data": _price});
                    } else {
                        log.logger.error(errSave.message);
                        res.status(500).send({"status": "ERROR", "data": errSave.message});
                    }
                });
            } else {

                _price = price.findOne({_id: req.params.id}, function (err, price2Upd) {
                    price2Upd.description = req.body.description;
                    price2Upd.code = req.body.code;
                    price2Upd.topPrices = req.body.topPrices;
                    price2Upd.unit = req.body.unit;
                    price2Upd.save(function (errSave, dataSaved) {
                        if (!errSave) {
                            log.logger.update("Price UPD:%s - %s", dataSaved._id, usr.terminal);
                            res.status(200).send({"status": "OK", "data": dataSaved});
                        } else {
                            log.logger.error('Error: %s - %s', errSave.message, usr.terminal);
                            res.status(500).send({"status": "ERROR", "data": errSave.message});
                        }
                    });
                });
            }
        } catch (error) {
            res.status(500).send({"status": "ERROR", "data": "Error en addPrice " + error.message});
        }
    }

    function deletePrice(req, res) {
        var usr = req.usr,
            matchPrice = require('../models/matchPrice.js');

        price.remove({_id : req.params.id}, function (err) {
            if (!err) {
                matchPrice.remove({price: req.params.id}, function (err) {
                    if (!err) {
                        res.status(200).send({status: 'OK', data: {}});
                    } else {
                        log.logger.error('Error DELETE: %s - %s', err.message, usr.terminal);
                        res.status(403).send({status: 'ERROR', data: err.message});
                    }
                });
            } else {
                log.logger.error('Error DELETE: %s - %s', err.message, usr.terminal);
                res.status(403).send({status: 'ERROR', data: err.message});
            }
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