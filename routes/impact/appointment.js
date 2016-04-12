/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log, io) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Appointment = require('../../models/appointment.js'),
        AppointmentEmailQueue = require('../../models/appointmentEmailQueue.js'),
        util = require('util'),
        mail = require("../../include/emailjs"),
        config = require('../../config/config.js');

    function validateSanitize(req, res, next) {
        var errors;
        var Validr = require('../../include/validation.js');
        var validate = new Validr.validation(req.body, {
            isContainer: function (container) {
                return /\D{4}\d{7}/.test(container);
            }
        });

        // use string with dot-notation to validate nested fields
        validate
            .validate('buque', 'buque is required.')
            .isLength(1)
        validate
            .validate('viaje', 'viaje is required.')
            .isLength(1);
        validate
            .validate('mov', {
                isLenght: 'mov is required.',
                isIn: 'mov must be in "IMPO" or "EXPO" values.'
            }, {ignoreEmpty: true})
            .isLength(1)
            .isIn(['EXPO', 'IMPO']);
        validate
            .validate('inicio', {
                isLength: 'inicio is required.',
                isDate: 'inicio must be a valid date'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('fin', {
                isLength: 'fin is required.',
                isDate: 'fin must be a valid date'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('alta', {
                isLength: 'alta is required.',
                isDate: 'alta must be a valid date'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('disponibles_t1', 'disponible_t1 must be an integer')
            .isInt();
        validate
            .validate('user', {
                isIn: 'user must be in "CLIENTE" or "TERMINAL" values.'
            }, {ignoreEmpty: true})
            .isLength(1)
            .isIn(['CLIENTE', 'TERMINAL']);
        validate
            .validate('verifica', 'verifica must be a valid date', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('verifica_turno', 'verifica_turno must be in "MA" or "TA" values.', {ignoreEmpty: true})
            .isIn(['MA', 'TA']);
        validate
            .validate('verifica_tipo', 'verifica_tipo must be in "PISO" or "CAMION" values.', {ignoreEmpty: true})
            .isIn(['PISO', 'CAMION']);
        validate
            .validate('email', 'email must be a valid email account.', {ignoreEmpty: true})
            .isEmail();
        validate
            .validate('contenedor', 'container is not valid')
            .isLength(1)
            .isContainer();

        errors = validate.validationErrors();
        if (errors) {
            res.status(400).send({
                status: "ERROR",
                message: "Error en la validacion del Appointment",
                data: util.inspect(errors)
            });
        } else {
            next();
        }

    }

    function addAppointmentEmailQueue(appointmentEmail, callback) {

        var appo = {};

        appo.date = new Date();
        appo.status = 1;
        appo.appointment = appointmentEmail._id;
        appo.terminal = {
            description: appointmentEmail.full_name
        };
        AppointmentEmailQueue.create(appo, function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        });
    }

    function reportClient(req, res) {
        var appointmentEmail = req.appointment,
            mailer,
            emailConfig,
            subject;

        res.render('comprobanteTurno.jade', appointmentEmail, function (err, html) {
            if (err) {
                log.logger.error("Se produjo un error en la creacion del comprobante, Email No enviado. %s", err.message);
                res.end();
            } else {
                html = {
                    data : html,
                    alternative: true
                };

//            appointmentEmail.email = "agpdesarrollo@gmail.com";

                if (appointmentEmail.email !== undefined && appointmentEmail.email !== '' && appointmentEmail.email !== null) {
                    //Successfully appointment inserted
                    emailConfig = Object.create(config.emailTurnos);
                    emailConfig.throughBcc = false;

                    mailer = new mail.mail(emailConfig);
                    subject = util.format("Coordinación %s para %s.", appointmentEmail.contenedor, appointmentEmail.full_name);
                    mailer.send(appointmentEmail.email, subject, html, function (err1) {
                        if (err1) {

                            if (err1.status === 'ERROR' && err1.code === 'AGP-0001') {
                                log.logger.error('Envío de email a cliente %s, la cuenta no valida. %s, %s', appointmentEmail.email, appointmentEmail.contenedor, err1.data);
                                res.end();
                            } else {
                                log.logger.error('Envío de email a cliente : %s, %s, %j, %s', appointmentEmail.email, appointmentEmail.contenedor, err1, err1);
                                mailer = new mail.mail(emailConfig);
                                mailer.send(appointmentEmail.email, subject, html, function (err2) {
                                    if (err2) {
                                        addAppointmentEmailQueue(appointmentEmail, function (err) {
                                            if (err) {
                                                log.logger.error('REENVIO - a: %s, No ha sido encolado, no se reenviara nuevamente. %s, %j, %s', appointmentEmail.email, appointmentEmail.contenedor, err2, err2);
                                            } else {
                                                log.logger.error('REENVIO - a: %s, se encola en base de datos. - %s, %j, %s', appointmentEmail.email, appointmentEmail.contenedor, err2, err2);
                                            }
                                        });
                                    } else {
                                        log.logger.info('REENVIO - Confirmación enviada correctamente, %s, se envió mail a %s - %s', appointmentEmail.full_name, appointmentEmail.email, appointmentEmail.contenedor);
                                        Appointment.update({_id: appointmentEmail._id}, {$set: {emailStatus: true}}, function (err, data) {
                                            res.end();
                                        });
                                    }
                                    res.end();
                                });
                            }
                        } else {

                            log.logger.info('Confirmación enviada correctamente, %s, se envió mail a %s - %s - %s', appointmentEmail.full_name, appointmentEmail.email, appointmentEmail.contenedor, appointmentEmail._id.toString());
                            Appointment.update({_id: appointmentEmail._id}, {$set: {emailStatus: true}}, function (err, data) {
                                res.end();
                            });
                        }
                    });
                }
                res.end();
            }
        });
    }

    function addAppointment(req, res, next) {
        var usr = req.usr,
            appointment2insert = req.body,
            errMsg,
            Account = require('../../models/account');

        appointment2insert.terminal = usr.terminal;

        if (appointment2insert) {
            Appointment.insert(appointment2insert, function (errData, data) {
                var str,
                    result;
                if (!errData) {
                    str = util.format('Appointment INS: %s - Inicio: %s - Alta: %s - %s - %s', usr.terminal, data.inicio, data.alta, data._id, data.contenedor);
                    log.logger.insert(str);

                    result = {status: 'OK', data: data};
                    io.emit('appointment', result);
                    res.status(200).send(result);

                    Account.findEmailToAppByUser(usr.user, 'emailAppointmentToApp', function (err, emails) {
                        if (!err) {

                            if (emails.data.length > 0) {
                                data.full_name = usr.full_name;
                                req.appointment = data;
                                next(); // en reportClient function se enviará email
                            }
                        }
                    });

                } else {
                    errMsg = util.format('%s.-%s- \n%s', errData.toString(), usr.terminal, JSON.stringify(req.body));
                    log.logger.error(errMsg);

                    res.status(500).send({status: 'ERROR', data: errMsg});
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

    router.post('/', validateSanitize, addAppointment, reportClient);

    return router;
};