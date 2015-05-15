    /**
    * Created by Diego Reyes on 3/21/14.
    */

module.exports = function (log, io, app) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Appointment = require('../models/appointment.js'),
        util = require('util'),
        mail = require("../include/emailjs"),
        config = require('../config/config.js');

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

    function addAppointment(req, res) {
        var usr = req.usr,
            appointment2insert = req.body,
            errMsg,
            strSubject,
            mailer;

        appointment2insert.inicio = moment(appointment2insert.inicio);
        appointment2insert.fin = moment(appointment2insert.fin);
        appointment2insert.terminal = usr.terminal;
        if (appointment2insert.alta !== undefined && appointment2insert.alta !== null) {
            appointment2insert.alta = moment(appointment2insert.alta);
        }


        if (appointment2insert) {
            Appointment.insert(appointment2insert, function (errData, data) {
                if (!errData) {
                    var str = util.format('Appointment INS: %s - %s - Inicio: %s, Fin: %s, Alta: %s', data._id, usr.terminal, data.inicio, data.fin, data.alta),
                        result = {status: 'OK', data: data};
                    log.logger.insert(str);

                    io.sockets.emit('appointment', result);
                    res.status(200).send(result);
                } else {
                    errMsg = util.format('%s.-%s- \n%s', errData.toString(), usr.terminal, JSON.stringify(req.body));
                    strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                    mailer = new mail.mail(config.email);

                    log.logger.error(errMsg);
                    mailer.send(usr.email, strSubject, errMsg, function () {
                    });

                    res.status(500).send({status: 'ERROR', data: errMsg});
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
    router.post('/appointment', addAppointment);
    app.post('/appointment', isValidToken, addAppointment);

    return router;
};