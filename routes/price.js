/**
 * Created by Administrator on 1/10/14.
 */

module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require('util'),
        moment = require('moment'),
        mail = require("../include/emailjs"),
        config = require('../config/config.js'),
        price = require('../models/price.js');

    function getPrices(req, res) {

        var usr = req.usr,
            paramTerminal = req.params.terminal,
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

        price.find(param, {topPrices : {$slice: -1}})
            .sort({terminal: 1, code: 1})
            .exec(function (err, priceList) {
                if (!err) {
                    res.status(200).send({
                        status: 'OK',
                        totalCount: priceList.length,
                        data: priceList
                    });
                } else {
                    log.logger.error('Error: %s', err.message);
                    res.status(500).send({status: 'ERROR', data: err.message});
                }
            });
    }

    function getPrice(req, res) {
        var usr = req.usr,
            paramTerminal = req.params.terminal,
            ter = (usr.role === 'agp') ? paramTerminal : usr.terminal,
            param = {
                $or : [
                    {terminal: "AGP"},
                    {terminal: ter}
                ]
            };

        if (req.params.id) {
            param._id = req.params.id;
        }

        price.findOne(param)
            .exec(function (err, price) {
                if (!err) {
                    res.status(200).send({status: 'OK', totalCount: 1, data: price});
                } else {
                    log.logger.error('Error: %s', err.message);
                    res.status(500).send({status: 'ERROR', data: err.message});
                }
            });
    }

    function getRates(req, res) {
        var usr = req.usr,
            param = {
                terminal: "AGP",
                rate: {$ne: null}
            };

        price.find(param)
            .sort({rate: 1, code: 1})
            .exec(function (err, priceList) {
                if (!err) {
                    res.status(200).send({status: 'OK', data: priceList});
                } else {
                    log.logger.error('Error: %s', err.message);
                    res.status(500).send({status: 'ERROR', data: err.message});
                }
            });
    }

    function getRates2(req, res) {
        var pri,
            priz;

        if (req.usr.terminal !== 'AGP') {
            res.status(403).send({status: "ERROR", data: "No posee permisos para acceder a estos datos."});
        }
        pri = require('../include/price.js');
        priz = new pri.price();
        priz.rates(true, function (err, data) {
            res.status(200).send(data);
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
    router.get('/:terminal', getPrices);
    router.get('/:id/:terminal', getPrice);
    router.get('/rates/1/codes', getRates);
    router.get('/rates/1/all', getRates2);
    router.post('/price', addPrice);
    router.put('/price/:id', addPrice);
    router.delete('/price/:id', deletePrice);

    return router;

};