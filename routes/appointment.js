    /**
    * Created by Diego Reyes on 3/21/14.
    */

module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Account = require('../models/account'),
        Appointment = require('../models/appointment.js'),
        util = require('util');

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
            fechaIni = moment(moment(req.query.fechaInicio, ['YYYY-MM-DD HH:mm Z']));
            param.$or.push({inicio: {$lte: fechaIni}, fin: {$gte: fechaIni}});
            fechaFin = moment(moment(req.query.fechaFin, ['YYYY-MM-DD HH:mm Z']));
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
            jsonParam;

        if (req.query.fechaInicio) {
            fechaInicio = moment(moment(req.query.fechaInicio, ['YYYY-MM-DD'])).toDate();
        }

        if (req.query.fechaFin) {
            fechaFin = moment(moment(req.query.fechaFin, ['YYYY-MM-DD']).add(1, 'days')).toDate();
        }

        if (req.query.fecha !== undefined) {
            fechaInicio = moment(moment(req.query.fecha, ['YYYY-MM-DD'])).toDate();
            fechaFin = moment(fechaInicio).add(1, 'days').toDate();
        }

        param.terminal = usr.terminal;

        jsonParam = [
            {$match: { 'inicio': {$gte: fechaInicio, $lt: fechaFin} }},
            { $project: {'accessDate': { $subtract: [ '$inicio', 180 * 60 * 1000 ] }, terminal: '$terminal'} },
            { $group : {
                _id : { terminal: '$terminal',
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

        date = moment().subtract(moment().date() - 1, 'days').format('YYYY-MM-DD');
        if (req.query.fecha !== undefined) {
            date = moment(req.query.fecha, 'YYYY-MM-DD').subtract(moment(req.query.fecha).date() - 1, 'days');
        }
        monthsAgo = 4;
        if (req.query.monthsAgo) {
            monthsAgo = req.query.monthsAgo;
        }

        date5MonthsAgo = moment(date).subtract(monthsAgo, 'months').toDate();
        nextMonth = moment(date).add(1, 'months').toDate();

        jsonParam = [
            {$match: { 'inicio': {$gte: date5MonthsAgo, $lt: nextMonth} }},
            { $project: {
                accessDate: { $subtract: [ '$inicio', 180 * 60 * 1000 ] },
                dia: {$dateToString: { format: "%Y%m", date: {$subtract: ['$inicio', 180 * 60 * 1000]} }},
                terminal: '$terminal'
            }},
            { $group : {
                _id : { terminal: '$terminal',
                    year: { $year : "$accessDate" },
                    month: { $month : "$accessDate" },
                    dia: '$dia'
                    },
                cnt : { $sum : 1 }
            }},
            { $sort: {'_id.dia': 1, '_id.terminal': 1 }}
        ];

        Appointment.aggregate(jsonParam, function (err, data) {
            res.status(200).send(data);
        });
    }

    function getByContainer(req, res) {
        var param = {},
            appointments;

        if ( (req.query.email === undefined || req.query.email === '') && req.query._id === undefined) {
            res.status(400).send({status: 'ERROR', data: 'Debe proveer el dato del email para obtener el/los turnos.'});
        } else {
            param.contenedor = req.params.container.toUpperCase();

            if (req.query.email) {
                param.email = req.query.email.toLowerCase();
            }

            if (req.query._id) {
                param._id = req.query._id;
            }

            appointments = Appointment.find(param);
            appointments.exec(function (err, data) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    if (data.length === 1) {
                        Account.findOne({terminal: data[0].terminal}, function (err, account) {
                            data[0].full_name = account.full_name;
                            res.render('comprobanteTurno.jade', data[0], function (err, html) {
                                res.status(200).send(html);
                            });
                        });
                    } else {
                        res.status(200).send({status: 'OK', data: data});
                    }

                }
            });
        }
    }

    function getDistincts(req, res) {

        var usr = req.usr,
            distinct = '',
            param = {};

        if (req.route.path === '/:terminal/ships') {
            distinct = 'buque';
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        if (distinct !== '') {
            Appointment.distinct(distinct, param, function (err, data) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err});
                } else {
                    res.status(200).send({status: 'OK', totalCount: data.length, data: data.sort()});
                }
            });
        } else {
            res.status(400).send({status: 'ERROR', message: 'El ruta es inválida', data: []});
        }
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
    router.get('/container/:container', getByContainer);

    return router;
};