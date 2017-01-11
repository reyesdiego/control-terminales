/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log, io, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require('util'),
        mail = require("../../include/emailjs"),
        moment = require('moment'),
        config = require('../../config/config.js'),
        Invoice = require('../../models/invoice.js'),
        logInvoiceBody = false;

    function validateSanitize (req, res, next) {
        var errors,
            Validr = require('../../include/validation.js'),
            validate = new Validr.validation(req.postData);

        validate
            .validate('fechaEmision', {
                isLength: 'fechaEmision is required.',
                isDate: 'fechaEmision must be a valid date.'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('fechaVcto', 'fechaVcto must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('fechaServDesde', 'fechaServDesde must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('fechaServHasta', 'fechaServHasta must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('fechaVctoPago', 'fechaVctoPago must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('nroComprob', {
                isNumeric: 'nroComprob must be integer greater or equal to 0.',
                isInt: 'nroComprob must be integer greater or equal to 0.',
                isLength: 'nroComprob is required.'
            })
            .isNumeric()
            .isInt({min: 0})
            .isLength(1);
        validate
            .validate('codTipoComprob', {
              //  isInt: 'codTipoComprob must be integer',
                isLength: 'codTipoComprob is required.'
            })
            //.isInt({min: 0})
            .isLength(1);
        validate
            .validate('nroPtoVenta', 'nroPtoVenta is required.', {ignoreEmpty: true})
            .isInt({min: 0});
        validate
            .validate('nroDoc', 'nroDoc is required.', {ignoreEmpty: true})
            .isInt({min: 0});
        validate
            .validate('razon', 'razon is required.')
            .isLength(1)
            .trim();
        validate
            .validate('codMoneda', {
                isLength: 'codMoneda is required.',
                isIn: 'codMoneda must be in "PES" or "DOL" or "EUR" values'
            })
            .isLength(1)
            .isIn(['PES', 'DOL', 'EUR']);
        validate
            .validate('cotiMoneda', {
                isLength: 'cotiMoneda is required.',
                isFloat: 'cotiMoneda must be a float greater equal than 1'
            })
            .isLength(1)
            .isFloat({min: 1});

        validate
            .validate('impGrav', 'impGrav must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impNoGrav', 'impNoGrav must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impExento', 'impExento must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impIva', 'impIva must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impOtrosTrib', 'impOtrosTrib must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impSubtot', 'impSubtot must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impTotal', {
                isLength: 'impTotal is required.',
                isFloat: 'impTotal must be a float.'
            })
            .isLength(1)
            .isFloat();

        errors = validate.validationErrors();
        if (errors) {
            res.status(400).send({
                status: "ERROR",
                message: "Error en la validacion del Invoice",
                data: util.inspect(errors)
            });
        } else {
            next();
        }

    }

    function receiveInvoice(req, res, next) {

        var postData = '',
            mailer,
            strBody,
            strSubject,
            errMsg,
            contentTypeExists;

        contentTypeExists = req.headers["content-type"].toLowerCase().indexOf("text/plain");
        if (contentTypeExists === -1) {
            errMsg = util.format("El content-type:%s es incorrecto. Debe enviar text/plain. %s", req.headers["content-type"], req.usr.terminal);
            log.logger.error(errMsg);
            res.status(400).send(errMsg);
        } else {
            req.addListener("data", function(postDataChunk) {
                postData += postDataChunk;
            });
            req.addListener("end", function () {

                try {
                    if (logInvoiceBody === 1) {
                        log.logger.info("Invoice body INS: %s - %s", postData, req.usr.terminal);
                    }

                    req.postData = JSON.parse(postData);
                    req.postData.usr = req.usr;
                    next();

                } catch (errParsing) {
                    strBody = util.format("Parsing JSON: [%s], JSON:%s", errParsing.toString(), postData);
                    strSubject = util.format("AGP - %s - ERROR", req.usr.terminal);

                    log.logger.error(strBody);
                    mailer = new mail.mail(config.email);
                    mailer.send(req.usr.email, strSubject, strBody);
                    res.status(500).send({status: "ERROR", data: strBody});
                }

            });
        }

    }

    function add (req, res) {
        var Invoice = require('../../lib/invoice2.js');
        var InvoiceM,
            InvoiceO;

        var paramMongo = JSON.parse(JSON.stringify(req.postData));
        var paramOracle = JSON.parse(JSON.stringify(req.postData));

        InvoiceM = new Invoice();
        InvoiceM.add(paramMongo, io, function (err, data) {
            if (err) {
                log.logger.error("Invoice INS Mongo DB: %s - %s", err.message, err.data);
                //res.status(500).send(err);
            } else {
                let result = data;
                data = data.data;
                log.logger.insert("Invoice INS: %s - %s - Tipo: %s Nro: %s - %s", data._id, data.terminal, data.codTipoComprob, data.nroComprob, data.fecha.emision.toString());
                //res.status(200).send(result);
            }
        });

        InvoiceO = new Invoice(oracle);
        InvoiceO.add(paramOracle, io, function (err, data) {
            if (err) {
                log.logger.error("Invoice ORA INS: %s, %s", err.message, JSON.stringify(err.data));
                res.status(500).send(err);
            } else {
                let result = data;
                data = data.data;
                log.logger.insert("Invoice ORA INS: %s - %s - Tipo: %s Nro: %s - %s", data._id, data.terminal, data.codTipoComprob, data.nroComprob, data.fechaEmision.toString());

                res.status(200).send(result);
            }
        });

    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

//    router.post('/', receiveInvoice, validateSanitize, addInvoice);
    router.post('/', receiveInvoice, validateSanitize, add);

    return router;
};