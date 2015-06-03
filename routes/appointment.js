    /**
    * Created by Diego Reyes on 3/21/14.
    */

module.exports = function (log, io, app) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Appointment = require('../models/appointment.js'),
        AppointmentEmailQueue = require('../models/appointmentEmailQueue.js'),
        util = require('util'),
        mail = require("../include/emailjs"),
        config = require('../config/config.js'),
        verifica_tipo = {
            PISO: "PISO",
            CAMION: "CAMION"
        },
        verifica_turno = {
            MANANA: "MA",
            TARDE: "TA"
        };

    function getAppointments(req, res) {

        var usr = req.usr,
            fechaIni,
            fechaFin,
            param = {},
            limit = parseInt(req.params.limit, 10),
            skip = parseInt(req.params.skip, 10),
            appointment,
            order;

        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.buqueNombre) {
            param.buque = req.query.buqueNombre;
        }

        if (req.query.viaje) {
            param.viaje = req.query.viaje;
        }

        if (req.query.fechaInicio && req.query.fechaFin) {
            param.$or = [];
            fechaIni = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
            param.$or.push({inicio: {$lte: fechaIni}, fin: {$gte: fechaIni}});
            fechaFin = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
            param.$or.push({inicio: {$lte: fechaFin}, fin: {$gte: fechaFin}});
            param.$or.push({inicio: {$gte: fechaIni}, fin: {$lte: fechaFin}});
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        if (req.query.mov) {
            param.mov = req.query.mov;
        }

        if (req.query.email) {
            param.email = req.query.email;
        }

        appointment = Appointment.find(param).limit(limit).skip(skip);

        if (req.query.order) {
            order = JSON.parse(req.query.order);
            appointment.sort(order[0]);
        } else {
            appointment.sort({inicio: -1});
        }

        appointment.exec(function (err, appointments) {
            if (err) {
                log.logger.error("Error: %s", err.error);
                res.status(500).send({status: "ERROR", data: err});
            } else {
                Appointment.count(param, function (err, cnt) {
                    var pageCount = appointments.length,
                        result = {
                            status: 'OK',
                            totalCount: cnt,
                            pageCount: (limit > pageCount) ? limit : pageCount,
                            page: skip,
                            data: appointments
                        };
                    res.status(200).send(result);
                });
            }
        });
    }

    function getAppointmentsByHour(req, res) {
        var usr = req.usr,
            fechaInicio,
            fechaFin,
            param = {},
            jsonParam,
            date;

        if (req.query.fechaInicio) {
            fechaInicio = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD')).toDate();
        }

        if (req.query.fechaFin) {
            fechaFin = moment(moment(req.query.fechaFin).format('YYYY-MM-DD')).toDate();
        }

        date = moment(moment().format('YYYY-MM-DD')).toDate();
        if (req.query.fecha !== undefined) {
            fechaInicio = moment(moment(req.query.fecha).format('YYYY-MM-DD')).toDate();
            fechaFin = moment(date).add('days', 1).toDate();
        }

        param.terminal = usr.terminal;

        jsonParam = [
            {$match: { 'inicio': {$gte: fechaInicio, $lt: fechaFin} }},
            { $project: {'accessDate': '$inicio', terminal: '$terminal'} },
            { $group : {
                _id : { terminal: '$terminal',
                    year: { $year : "$accessDate" },
                    month: { $month : "$accessDate" },
                    day: { $dayOfMonth : "$accessDate" },
                    hour: { $hour : "$accessDate" }
                    },
                cnt : { $sum : 1 }
            }},
            { $sort: {'_id.hour': 1, '_id.terminal': 1 }}
        ];

        Appointment.aggregate(jsonParam, function (err, data) {
            res.status(200).send(data);
        });
    }

    function getAppointmentsByMonth(req, res) {

        var date,
            monthsAgo,
            date5MonthsAgo,
            nextMonth,
            jsonParam;

        date = moment(moment().format('YYYY-MM-DD')).subtract('days', moment().date() - 1);
        if (req.query.fecha !== undefined) {
            date = moment(req.query.fecha, 'YYYY-MM-DD').subtract('days', moment(req.query.fecha).date() - 1);
        }
        monthsAgo = 4;
        if (req.query.monthsAgo) {
            monthsAgo = req.query.monthsAgo;
        }

        date5MonthsAgo = moment(date).subtract('months', monthsAgo).toDate();
        nextMonth = moment(date).add('months', 1).toDate();

        jsonParam = [
            {$match: { 'inicio': {$gte: date5MonthsAgo, $lt: nextMonth} }},
            { $project: {'accessDate': '$inicio', terminal: '$terminal'} },
            { $group : {
                _id : { terminal: '$terminal',
                    year: { $year : "$accessDate" },
                    month: { $month : "$accessDate" }
                    },
                cnt : { $sum : 1 }
            }},
            { $sort: {'_id.month': 1, '_id.terminal': 1 }}
        ];

        Appointment.aggregate(jsonParam, function (err, data) {
            res.status(200).send(data);
        });
    }

    function addAppointmentEmailQueue(appointmentEmail, callback) {

        var appo = {};

        appo.date = new Date();
        appo.status = 1;
        appo.appointment = appointmentEmail._id;
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
            html = {
                data : html,
                alternative: true
            };

//            appointmentEmail.email = "agpdesarrollo@gmail.com";

            if (appointmentEmail.email !== undefined && appointmentEmail.email !== '' && appointmentEmail.email !== null) {
                //Successfully appointment inserted
                emailConfig = Object.create(config.email);
                emailConfig.throughBcc = false;

                mailer = new mail.mail(emailConfig);
                subject = util.format("Coordinación %s para %s.", appointmentEmail.contenedor, appointmentEmail.full_name);
                mailer.send(appointmentEmail.email, subject, html, function (err1) {
                    if (err1) {
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
                            }
                            res.end();
                        });

                    } else {
                        log.logger.info('Confirmación enviada correctamente, %s, se envió mail a %s - %s', appointmentEmail.full_name, appointmentEmail.email, appointmentEmail.contenedor);
                        res.end();
                    }
                });
            }
            res.end();
        });
    }

    function addAppointment(req, res, next) {
        var usr = req.usr,
            appointment2insert = req.body,
            errMsg,
            Account = require('../models/account');

        appointment2insert.inicio = moment(appointment2insert.inicio);
        appointment2insert.fin = moment(appointment2insert.fin);
        appointment2insert.terminal = usr.terminal;
        if (appointment2insert.alta !== undefined && appointment2insert.alta !== null && appointment2insert.alta !== "") {
            appointment2insert.alta = moment(appointment2insert.alta);
        }
        if (appointment2insert.verifica !== undefined && appointment2insert.verifica !== null && appointment2insert.verifica !== "") {
            appointment2insert.verifica = moment(appointment2insert.verifica);
        }
        if (appointment2insert.verifica_tipo !== verifica_tipo.PISO && appointment2insert.verifica_tipo !== verifica_tipo.CAMION) {
            delete appointment2insert.verifica_tipo;
        }
        if (appointment2insert.verifica_turno !== verifica_turno.MANANA && appointment2insert.verifica_turno !== verifica_turno.TARDE) {
            delete appointment2insert.verifica_turno;
        }

        if (appointment2insert) {
            Appointment.insert(appointment2insert, function (errData, data) {
                var str,
                    result,
                    appointmentToMail = {};
                if (!errData) {
                    str = util.format('Appointment INS: %s - Inicio: %s - Alta: %s - %s - %s', usr.terminal, data.inicio, data.alta, data._id, data.contenedor);
                    log.logger.insert(str);

                    result = {status: 'OK', data: data};
                    io.sockets.emit('appointment', result);
                    res.status(200).send(result);

                    Account.findEmailToAppByUser(usr.user, 'emailAppointmentToApp', function (err, emails) {
                        if (!err) {

                            if (emails.data.length > 0) {
                                appointmentToMail._id = data._id;
                                appointmentToMail.full_name = usr.full_name;
                                appointmentToMail.fecha = moment(data.inicio).format("DD-MM-YYYY");
                                appointmentToMail.horario = moment(data.inicio).format("HH:mm") + 'hs. a ' + moment(data.fin).format("HH:mm") + "hs.";
                                appointmentToMail.alta = moment(data.alta).format("DD-MM-YYYY HH:mm") + " hs.";
                                appointmentToMail.contenedor = data.contenedor;
                                appointmentToMail.buque = data.buque;
                                appointmentToMail.viaje = data.viaje;
                                appointmentToMail.disponibles_t1 = data.disponibles_t1;
                                appointmentToMail.email = data.email;
                                appointmentToMail.mov = data.mov;
                                appointmentToMail.verifica = (data.verifica !== undefined && data.verifica !== null && data.verifica !== "") ? moment(data.verifica).format("DD-MM-YYYY") : data.verifica;
                                appointmentToMail.verifica_turno = data.verifica_turno;
                                appointmentToMail.verifica_tipo = data.verifica_tipo;
                                req.appointment = appointmentToMail;
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

    function getByContainer(req, res) {
        var param = {},
            appointments;

        if (req.query.email === undefined || req.query.email === '') {
            res.status(403).send({status: 'ERROR', data: 'Debe proveer el dato del email para obtener el/los turnos.'});
        } else {
            param.contenedor = req.params.container;
            param.email = req.query.email;

            appointments = Appointment.find(param);
            appointments.exec(function (err, data) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    res.status(200).send({status: 'OK', data: data});
                }
            });
        }
    }

    function getDistincts(req, res) {

        var usr = req.usr,
            distinct = '',
            param = {};

        if (req.route.path === '/:terminal/containers') {
            distinct = 'contenedor';
        }

        if (req.route.path === '/:terminal/ships') {
            distinct = 'buque';
        }

        param = {};
        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        Appointment.distinct(distinct, param, function (err, data) {
            if (err) {
                res.status(500).send({status: 'ERROR', data: err});
            } else {
                res.status(200).send({status: 'OK', totalCount: data.length, data: data.sort()});
            }
        });
    }

    function isValidToken(req, res, next) {

        var Account = require('../models/account.js'),
            incomingToken = req.headers.token;

        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(err);
                res.status(500).send({status: 'ERROR', data: err});
            } else {
                req.usr = usr;
                next();
            }
        });
    }

    /*
    router.use(function timeLog(req, res, next){
        log.logger.info('Time: %s', Date.now());
        next();
    });
    */

    router.get('/ByHour', getAppointmentsByHour);
    router.get('/ByMonth', getAppointmentsByMonth);
    router.get('/:terminal/:skip/:limit', getAppointments);
    router.get('/:terminal/containers', getDistincts);
    router.get('/:terminal/ships', getDistincts);

    app.post('/appointment', isValidToken, addAppointment, reportClient);
    app.get('/appointments/:container', getByContainer);

    return router;
};