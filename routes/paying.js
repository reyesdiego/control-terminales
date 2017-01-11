/**
 * Created by diego on 7/13/15.
 *
 * @module Paying
 */

module.exports = (log, oracle) => {
    'use strict';
    var express = require('express'),
        router = express.Router(),
        moment = require('moment');

    var PayingClass = require('../lib/paying.js');

    var addPrePayment = (req, res) => {
        var param,
            fecha = new Date();
        var moment = require('moment');

        var payingClass = new PayingClass(req.body.terminal, oracle);

        if (req.body.fecha) {
            fecha = moment(req.body.fecha, 'YYYY-MM-DD HH:mm:SS').toDate();
        }
        param = {
            fecha: fecha,
            user: req.usr
        };

        payingClass.addPrePayment(param)
            .then(data => {
                log.logger.info("Pre Payment INS MongoDB %s", data.data._id);
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("Pre Payment INS MongoDB %s", err);
                res.status(500).send(err);
            });
    };

    var add2PrePayment = (req, res) => {
        var params = {},
            options = {
                paginated: false,
                download: false
            };

        var payingClass = new PayingClass(req.params.terminal, oracle);

        params.fechaInicio = req.query.fechaInicio;
        params.fechaFin = req.query.fechaFin;
        params.codTipoComprob = req.query.codTipoComprob;
        params.buqueNombre = req.query.buqueNombre;
        params.razonSocial = req.query.razonSocial;
        params.contenedor = req.query.contenedor;

        if ((req.query.fechaInicio === undefined || req.query.fechaFin === undefined) && req.params._id === undefined) {
            res.status(400).send({status: "ERROR", message: "Debe proveer parametros de fecha"});
        } else {

            payingClass.getNotPayed(params, options)
                .then(data => {
                    var invoiceIds = data.data.map(item => (item._id));
                    payingClass.setPayment2Invoice(invoiceIds, req.body.paymentId)
                        .then(data => {
                            res.status(200).send(data);
                        })
                        .catch(err => {
                            res.status(500).send(err);
                        });
                })
                .catch(err => {
                    res.status(500).send(err);
                });
        }
    };

    var deletePrePayment = (req, res) => {

        var payingClass = new PayingClass(oracle);
        var _id = req.params._id;

        payingClass.deletePrePayment(_id)
            .then(data => {
                log.logger.info("Payment DEL MongoDB %s", _id);
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("Payment DEL MongoDB %s", err);
                res.status(500).send(err);
            });
    };

    var getNotPayed = (req, res) => {
        var params = {},
            options = {
                paginated: true,
                download: false
            },
            response;

        var payingClass = new PayingClass(req.params.terminal, oracle);

        if (req.route.path.indexOf('/download') > 0) {
            options.paginated = false;
            options.download = true;
        }

        params.fechaInicio = req.query.fechaInicio;
        params.fechaFin = req.query.fechaFin;
        params.codTipoComprob = req.query.codTipoComprob;
        params.buqueNombre = req.query.buqueNombre;
        params.razonSocial = req.query.razonSocial;
        params.contenedor = req.query.contenedor;

        if (options.paginated) {
            options.skip = parseInt(req.params.skip, 10);
            options.limit = parseInt(req.params.limit, 10);
            options.byContainer = req.query.byContainer;
            options.order = req.query.order;
        }

        if ((req.query.fechaInicio === undefined || req.query.fechaFin === undefined) && req.params._id === undefined) {
            res.status(400).send({status: "ERROR", message: "Debe proveer parametros de fecha"});
        } else {

            payingClass.getNotPayed(params, options)
                .then(data => {
                    if (options.download) {
                        if (req.query.byContainer === '1') {
                            response = "FECHA|TIPO|SUCURSAL|COMPROBANTE|BUQUE|RAZON|CONTENEDOR|TONELADAS|TARIFA|TASA|COTI_MONEDA|TOTAL\n";
                        } else {
                            response = "FECHA|TIPO|BUQUE|RAZON|TONELADAS|TARIFA|TASA|COTI_MONEDA|TOTAL\n";
                        }
                        data.data.forEach(item => {
                            response = response +
                                moment(item.emision).format("DD/MM/YYYY") +
                                "|" +
                                global.cache.voucherTypes[item.codTipoComprob];
                            if (req.query.byContainer === '1') {
                                response = response + "|" +
                                    item.nroPtoVenta +
                                    "|" +
                                    item.nroComprob;
                            }
                            response = response + "|" +
                                item.buque +
                                "|" +
                                item.razon;
                            if (req.query.byContainer === '1') {
                                response = response + "|" +
                                    item.container;
                            }
                            response = response + "|" +
                                item.cnt +
                                "|" +
                                item.impUnit +
                                "|" +
                                item.tasa +
                                "|" +
                                item.cotiMoneda +
                                "|" +
                                item.totalTasa +
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
    };

    var getPayed = (req, res) => {

        var payingClass = new PayingClass(req.params.terminal, oracle);

        var options = {
            paginated: true,
            skip: parseInt(req.params.skip, 10),
            limit: parseInt(req.params.limit, 10),
            byContainer: req.query.byContainer,
            order: req.query.order
        };

        payingClass.getNotPayed({_id: req.params._id}, options)
        .then(data => {
                res.status(200).send({status: "OK", totalCount: data.totalCount, data: data.data});
            })
        .catch(err => {
                res.status(500).send({status: "ERROR", message: err.message, data: null});
            });
    };

    var getPrePayment = (req, res) => {

        var payingClass = new PayingClass(req.params.terminal, oracle);

        var params = {};

        if (req.query.paymentId) {
            params.paymentId = req.query.paymentId;
        } else {

            params = {
                fechaInicio: req.query.fechaInicio,
                fechaFin: req.query.fechaFin,
                payment: false
            };

            if (req.query.codTipoComprob) {
                params.codTipoComprob = parseInt(req.query.codTipoComprob, 10);
            }
            if (req.query.buqueNombre) {
                params.buqueNombre = req.query.buqueNombre;
            }
            if (req.query.razonSocial) {
                params.razon = req.query.razonSocial;
            }
            if (req.query.contenedor) {
                params.contenedor = req.query.contenedor;
            }
        }

        payingClass.getPrePayment(params)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
            });
    };

    var getPayments = (req, res) => {
        var options = {
                skip: parseInt(req.params.skip, 10),
                limit: parseInt(req.params.limit, 10),
                order: req.query.order
            },
            params = {};

        var payingClass = new PayingClass(req.params.terminal, oracle);

        params.modo = req.query.modo;
        if (req.query.numero) {
            params.preNumber = parseInt(req.query.numero, 10);
            params.number = parseInt(req.query.numero, 10);
        }

        if (req.query.fechaInicio) {
            params.fechaInicio = req.query.fechaInicio;
        }
        if (req.query.fechaFin) {
            params.fechaFin = req.query.fechaFin;
        }

        payingClass.getPayments(params, options)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    var getPayment = (req, res) => {

        var payingClass = new PayingClass(oracle);
        var id = req.params._id;

        payingClass.getPayment(id)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    var setPayment = (req, res) => {
        var param;

        var payingClass = new PayingClass(req.body.terminal, oracle);

        param = {
            preNumber: req.body.preNumber,
            user: req.usr
        };
        payingClass.setPayment(param)
        .then(data => {
                log.logger.info("Payment INS MongoDB");
                res.status(200).send(data);
            })
        .catch(err => {
                log.logger.error("Payment INS MongoDB %s", err);
                res.status(500).send(err);
            });
    };

    router.get('/payed/:terminal/:_id/:skip/:limit', getPayed);
    router.get('/notPayed/:terminal/:skip/:limit', getNotPayed);
    router.get('/notPayed/:terminal/download', getNotPayed);
    router.get('/payments/:terminal/:skip/:limit', getPayments);
    router.get('/payment/:_id', getPayment);
    router.get('/prePayments/:terminal/:skip/:limit', getPayments);
    router.get('/getPrePayment/:terminal', getPrePayment);

    router.post('/prePayment', addPrePayment);
    router.delete('/prePayment/:_id', deletePrePayment);
    router.put('/payment', setPayment);
    router.put('/addToPrePayment/:terminal', add2PrePayment);

    return router;
};
