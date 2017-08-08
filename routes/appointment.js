/**
 * Created by Diego Reyes on 3/21/14.
 */

module.exports = log => {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Account = require('../models/account'),
        Appointment = require('../models/appointment.js'),
        Invoice = require('../models/invoice.js'),
        config = require('../config/config.js'),
        util = require('util'),
        linq = require('linq');

    var AppointmentLib = require('../lib/appointment.js');
    AppointmentLib = new AppointmentLib();

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

    let getAppointmentById = (req, res) => {

        if ( req.params._id === undefined) {
            res.status(400).send({status: 'ERROR', data: 'Debe proveer el dato del id para obtener el turnos.'});
        } else {

            AppointmentLib.getById(req.params._id)
                .then(data => {
                    res.status(200).send(data);
                })
                .catch(err => {
                    res.status(500).send({status: 'ERROR', data: err.message});
                });
        }
    };

    function getAppointmentsByHour(req, res) {

        var seneca = require("seneca")({timeout: config.microService.statisticMongo.timeout});
        seneca.client(config.microService.statisticMongo.port, config.microService.statisticMongo.host);

        var usr = req.usr;
        var moment = require("moment");

        var param = {
            role: "statistic",
            cmd: "getCountByHour",
            entity: "appointment"
        };

        if (req.query.fechaInicio) {
            param.fechaInicio = req.query.fechaInicio;
        }

        if (req.query.fechaFin) {
            param.fechaFin = req.query.fechaFin;
        }

        if (req.query.fecha !== undefined) {
            param.fechaInicio = moment(moment(req.query.fecha, ['YYYY-MM-DD'])).toDate();
            param.fechaFin = moment(param.fechaInicio).add(1, 'days').toDate();
        }

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getAppointmentsByMonth(req, res) {

        var seneca = require("seneca")({timeout: config.microService.statisticMongo.timeout});
        seneca.client(config.microService.statisticMongo.port, config.microService.statisticMongo.host);

        var date;

        var param = {
            role: "statistic",
            cmd: "getCountByMonth",
            entity: "appointment"
        };

        date = moment().subtract(moment().date() - 1, 'days').format('YYYY-MM-DD');
        if (req.query.fecha !== undefined) {
            date = moment(req.query.fecha, 'YYYY-MM-DD').format('YYYY-MM-DD');
        }
        var monthsAgo = 4;
        if (req.query.monthsAgo) {
            monthsAgo = req.query.monthsAgo;
        }

        param.fecha = date;
        param.monthsAgo = monthsAgo;

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send({
                    status: "ERROR",
                    message: err.msg,
                    data: err
                });
            } else {
                res.status(200).send(data);
            }
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
                        Account.findOne({full_name : {$nin: ["Daniel Bruzon"]}, terminal: data[0].terminal}, function (err, account) {
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

    let getByPatente = (req, res) => {
        var param = {
            patenteCamion: req.params.patente.toUpperCase(),
            inicio: {$gte: moment(moment().format("YYYY-MM-DD")).toDate()}
        };

        Appointment
            .find(param, {_id: false, 'transporte.camion': 1, contenedor: 1, inicio: 1, fin: 1, 'transporte.dni':1, 'transporte.celular': 1})
            .sort({inicio: 1})
            .exec((err, data) => {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    res.status(200).send({status: 'OK', data: data});
                }
            });
    };

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

    function getMissingAppointments(req, res) {
        var usr = req.usr,
            terminal = '',
            _price,
            _rates;

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }

        _price = require('../include/price.js');
        _rates = new _price.price(terminal);
        _rates.rates(function (err, rates) {

            var invoices = Invoice.aggregate([
                {$match: {terminal: terminal, codTipoComprob: 1, 'detalle.items.id': {$in: rates}}},
                {$project: {detalle: 1, fecha: '$fecha.emision'}},
                {$unwind: '$detalle'},
                {$unwind: '$detalle.items'},
                {$match: {'detalle.items.id': {$in: rates}}},
                {$group: {_id: {c: '$detalle.contenedor', f: '$fecha'}}},
                {$project: {
                    _id: false,
                    c: '$_id.c',
                    f: '$_id.f'
                }}
            ]);

            invoices.exec(function (err, dataInvoices) {
                var appointments;
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    appointments = Appointment.find({terminal: terminal}, {contenedor: true, _id: false});
                    appointments.exec(function (err, dataAppointments) {
                        var invoicesWoGates;
                        if (err) {
                            res.status(500).send({status: 'ERROR', data: err.message});
                        } else {
                            dataAppointments = linq.from(dataAppointments).select("{c: $.contenedor}");
                            invoicesWoGates = linq.from(dataInvoices)
                                .except(dataAppointments, "$.c").toArray();
                            //.except(dataGates).toArray();

                            res.status(200)
                                .send({
                                    status: 'OK',
                                    totalCount: invoicesWoGates.length,
                                    data: invoicesWoGates
                                });
                            res.flush();
                        }
                    });
                }
            });
        });
    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.get('/ById/:_id', getAppointmentById);
    router.get('/ByHour', getAppointmentsByHour);
    router.get('/ByMonth', getAppointmentsByMonth);
    router.get('/:terminal/:skip/:limit', getAppointments);
    router.get('/:terminal/containers', getDistincts);
    router.get('/:terminal/ships', getDistincts);
    router.get('/container/:container', getByContainer);
    router.get('/:terminal/missingAppointments', getMissingAppointments);
    router.get('/patente/:patente', getByPatente);

    return router;
};