/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log, io) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Gate = require('../../models/gate.js'),
        util = require('util'),
        mail = require("../../include/emailjs"),
        config = require('../../config/config.js');

    function validateSanitize(req, res, next) {
        var errors;
        var Validr = require('../../include/validation.js');
        var validate = new Validr.validation(req.body);

        validate
            .validate('buque', 'buque is required.')
            .isLength(1)
        validate
            .validate('viaje', 'viaje is required.')
            .isLength(1);
        validate
            .validate('mov', {
                isLenght: 'mov is required.',
                isIn: 'mov must be in "IMPO" or "EXPO" or "PASO" values.'
            })
            .isLength(1)
            .isIn(['EXPO', 'IMPO', 'PASO']);
        validate
            .validate('tipo', {
                isLenght: 'tipo is required.',
                isIn: 'tipo must be in "IN" or "OUT" values.'
            })
            .isLength(1)
            .isIn(['IN', 'OUT']);
        validate
            .validate('carga', {
                isLenght: 'carga is required.',
                isIn: 'carga must be in "VA" or "LL" or "NO" values.'
            })
            .isLength(1)
            .isIn(['VA', 'NO', 'LL']);
        validate
            .validate('patenteCamion', 'patenteCamion is invalid.', {ignoreEmpty: true})
            .isLength(1, 6, 6)
        validate
            .validate('gateTimestamp', {
                isLength: 'gateTimestamp is required.',
                isDate: 'gateTimestamp must be a valid date'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('turnoInicio', {
                isLength: 'turnoInicio is required.',
                isDate: 'turnoInicio must be a valid date'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('turnoFin', {
                isLength: 'turnoFin is required.',
                isDate: 'turnoFin must be a valid date'
            })
            .isLength(1)
            .isDate();

        errors = validate.validationErrors();
        if (errors) {
            res.status(400).send({
                status: "ERROR",
                message: "Error en la validacion del Gate",
                data: util.inspect(errors)
            });
        } else {
            next();
        }

    }

    function addGate(req, res) {

        var usr = req.usr,
            gate2insert = req.body,
            errMsg,
            strSubject,
            mailer,
            socketMsg;

        gate2insert.terminal = usr.terminal;

        if (gate2insert) {
            Gate.insert(gate2insert, function (errSave, gateNew) {
                if (errSave) {

                    errMsg = util.format('%s - ERROR: %s.-%s- \n%s', moment().format("YYYY-MM-DD HH:mm"), errSave.toString(), usr.terminal, JSON.stringify(req.body));
                    log.logger.error(errMsg);

                    strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                    mailer = new mail.mail(config.email);
                    mailer.send(usr.email, strSubject, errMsg);

                    res.status(500).send({status: "ERROR", data: errMsg});
                } else {
                    log.logger.insert('Gate INS: %s - %s - %s', gateNew._id, usr.terminal, moment(gateNew.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"));
                    socketMsg = {
                        status: 'OK',
                        data: gateNew
                    };
                    io.sockets.emit('gate', socketMsg);
                    res.status(200).send(socketMsg);
                }
            });
        }
    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.post('/', validateSanitize, addGate);

    return router;
};