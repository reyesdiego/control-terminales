/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log, io, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Appointment = require('../../models/appointment.js'),
        AppointmentEmailQueue = require('../../models/appointmentEmailQueue.js'),
        mail = require("../../include/emailjs"),
        config = require('../../config/config.js');

    function validateSanitize(req, res, next) {
        var util = require('util');
        var errors;
        var Validr = require('../../include/validation.js');
        var validate = new Validr.validation(req.body, {
            isContainer: function (container) {
                return /\D{4}\d{7}/.test(container);
            }
        });

        // use string with dot-notation to validate nested fields
        //validate
        //    .validate('buque', 'buque is required.')
        //    .isLength(1);
        //validate
        //    .validate('viaje', 'viaje is required.')
        //    .isLength(1);
        validate
            .validate('mov', {
                isLenght: 'mov is required.',
                isIn: 'mov must be in "IMPO", "EXPO", "VACIO_IN" or "VACIO_OUT" values.'
            }, {ignoreEmpty: true})
            .isLength(1)
            .isIn(['EXPO', 'IMPO', 'VACIO_IN', 'VACIO_OUT']);
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

        res.render('comprobanteTurno.jade', appointmentEmail, (err, html) => {
            if (err) {
                log.logger.error("Se produjo un error en la creacion del comprobante, Email No enviado. %s", err.message);
                res.end();
            } else {
                html = {
                    data : html,
                    alternative: true
                };

                if (appointmentEmail.email !== undefined && appointmentEmail.email !== '' && appointmentEmail.email !== null) {
                    //Successfully appointment inserted
                    emailConfig = Object.create(config.emailTurnos);
                    emailConfig.throughBcc = false;

                    mailer = new mail.mail(emailConfig);
                    subject = `Coordinación ${appointmentEmail.contenedor} para ${appointmentEmail.full_name}.`;
                    mailer.send(appointmentEmail.email, subject, html, (err1, emailData) => {
                        if (err1) {

                            if (err1.code === 'AGP-0001') {
                                log.logger.error('No envió email a Cliente %s, Cuenta no valida. %s, %s', appointmentEmail.email, appointmentEmail.contenedor, err1.data);
                                res.end();
                            } else if (err1.code === 'AGP-0008') {
                                log.logger.error('No envió email a Cliente %s, Desahibilado por Config. %s, %s', appointmentEmail.email, appointmentEmail.contenedor, err1.data);
                                res.end();
                            } else {
                                log.logger.error('Envío de email a cliente : %s, %s, %j, %s', appointmentEmail.email, appointmentEmail.contenedor, err1, err1);
                                mailer = new mail.mail(emailConfig);
                                mailer.send(appointmentEmail.email, subject, html, err2 => {
                                    if (err2) {
                                        addAppointmentEmailQueue(appointmentEmail, err => {
                                            if (err) {
                                                log.logger.error('REENVIO - a: %s, No ha sido encolado, no se reenviara nuevamente. %s, %j, %s', appointmentEmail.email, appointmentEmail.contenedor, err2, err2);
                                            } else {
                                                log.logger.error('REENVIO - a: %s, se encola en base de datos. - %s, %j, %s', appointmentEmail.email, appointmentEmail.contenedor, err2, err2);
                                            }
                                        });
                                    } else {
                                        log.logger.info('REENVIO - Confirmación enviada correctamente, %s, se envió mail a %s - %s', appointmentEmail.full_name, appointmentEmail.email, appointmentEmail.contenedor);
                                        Appointment.update({_id: appointmentEmail._id}, {$set: {emailStatus: true}}, (err, data) => {
                                            res.end();
                                        });
                                    }
                                    res.end();
                                });
                            }
                        } else {

                            log.logger.info('Confirmación enviada correctamente, %s, se envió mail a %s - %s - %s', appointmentEmail.full_name, appointmentEmail.email, appointmentEmail.contenedor, appointmentEmail._id.toString());
                            Appointment.update({_id: appointmentEmail._id}, {$set: {emailStatus: true}}, (err, data) => {
                                res.end();
                            });
                        }
                    });
                }
                res.end();
            }
        });
    }

    let addAppointment = (req, res, next) => {
        var usr = req.usr,
            appointment2insert = req.body,
            errMsg;

        var Appointment = require('../../lib/appointment.js');
        Appointment = new Appointment();

        appointment2insert.terminal = usr.terminal;

        if (req.body.patenteCamion) {
            appointment2insert.patenteCamion = req.body.patenteCamion;
        }
        if (req.body.patenteSemi) {
            appointment2insert.patenteSemi = req.body.patenteSemi;
        }
        if (req.body.dni) {
            appointment2insert.dni = req.body.dni;
        }
        if (req.body.celular) {
            appointment2insert.celular = req.body.celular;
        }

        Appointment.add(appointment2insert)
            .then(data => {
                var str,
                    appointment;

                appointment = data.data;
                str = `Appointment INS: ${appointment.terminal} - Alta: ${appointment.alta} - ${appointment._id} - ${appointment.contenedor}`;
                log.logger.insert(str);

                io.emit('appointment', appointment);

                res.status(200).send(data);

                /**
                 * with next() reportClient function se enviará email
                 * */
                var emailAppointmentToApp = usr.emailToApp.emailAppointmentToApp;
                if (emailAppointmentToApp) {
                    appointment.full_name = usr.full_name;
                    req.appointment = appointment;
                    next();
                }
            })
            .catch(err => {
                errMsg = `Appointment ERROR: ${usr.terminal} - ${err.message} - ${JSON.stringify(req.body)}`;
                log.logger.error(errMsg);
                res.status(500).send(err);

                var appointmentError = usr.emailToApp.appointmentError;
                if (appointmentError) {
                    var mailer = new mail.mail(config.emailTurnos);
                    var subject = `Appointment Insert ERROR ${moment().format("DD-MM-YYYY HH:m:ss")}`;
                    mailer.send(usr.email, subject, err.message);
                }
            });
    };

    let setTransporte = (req, res) => {
        var params = {};
        var Appointment = require('../../lib/appointment.js');
        Appointment = new Appointment();

        if (req.body.patenteCamion) {
            params.patenteCamion = req.body.patenteCamion;
        }
        if (req.body.patenteSemi) {
            params.patenteSemi = req.body.patenteSemi;
        }
        if (req.body.dni) {
            params.dni = req.body.dni;
        }
        if (req.body.celular) {
            params.celular = req.body.celular;
        }
        if (req.body._id) {
            params._id = req.body._id;
        } else {
            params.contenedor = req.body.contenedor;
            params.buque = req.body.buque;
        }

        Appointment.setTransporte(params)
        .then(data => {
                let str = `Appointment UPDATE Transporte: - : ${JSON.stringify(req.body)}`;
                log.logger.insert(str);

                res.status(200).send(data);
            })
        .catch(err => {
                let errMsg = `Appointment UPDATE Transporte ERROR: - ${err.message} - ${JSON.stringify(req.body)}`;
                log.logger.error(errMsg);
                res.status(500).send(err);
            });
    };
    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.post('/', validateSanitize, addAppointment, reportClient);
    router.put('/patente', setTransporte);

    return router;
};