/**
 * Created by diego on 6/11/15.
 */

module.exports = function (log, io, app) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Appointment = require('../models/appointment.js'),
        AppointmentEmailQueue = require('../models/appointmentEmailQueue.js'),
        util = require('util'),
        config = require('../config/config.js'),
        Enumerable = require('linq');


    function getAppointmentsEmailQueue(req, res) {

        var usr = req.usr,
            fechaIni,
            fechaFin,
            param = {},
            limit = parseInt(req.params.limit, 10),
            skip = parseInt(req.params.skip, 10),
            appointmentEmailQueue,
            order;

        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.buqueNombre) {
            param.buque = req.query.buqueNombre;
        }

        if (req.query.fechaInicio && req.query.fechaFin) {
            param.$or = [];
            fechaIni = moment(moment(req.query.fechaInicio).format('YYYY-MM-DD HH:mm Z'));
            param.$or.push({inicio: {$lte: fechaIni}, fin: {$gte: fechaIni}});
            fechaFin = moment(moment(req.query.fechaFin).format('YYYY-MM-DD HH:mm Z'));
            param.$or.push({inicio: {$lte: fechaFin}, fin: {$gte: fechaFin}});
            param.$or.push({inicio: {$gte: fechaIni}, fin: {$lte: fechaFin}});
        }

        if (req.query.mov) {
            param.mov = req.query.mov;
        }

        if (req.query.email) {
            param.email = req.query.email;
        }

        appointmentEmailQueue = AppointmentEmailQueue.find(param).limit(limit).skip(skip);
        appointmentEmailQueue.populate({path: 'appointment'});

        if (req.query.order) {
            order = JSON.parse(req.query.order);
            appointmentEmailQueue.sort(order[0]);
        } else {
            appointmentEmailQueue.sort({inicio: -1});
        }

        appointmentEmailQueue.exec(function (err, appointmentsEmail) {
            var appos;
            if (err) {
                log.logger.error("Error: %s", err.error);
                res.status(500).send({status: "ERROR", data: err});
            } else {
                appos = Enumerable.from(appointmentsEmail)
                    .select(function (item) {
                        var app = (function (app) {
                            var localApp = app._doc;
                            return localApp;
                        })(item.appointment);
                        app.status = item.status;
                        app.date = item.date;
                        delete app.__v;
                        return app;
                    }).toArray();

                AppointmentEmailQueue.count(param, function (err, cnt) {
                    var pageCount = appointmentsEmail.length,
                        result = {
                            status: 'OK',
                            totalCount: cnt,
                            pageCount: (limit > pageCount) ? limit : pageCount,
                            page: skip,
                            data: appos
                        };
                    res.status(200).send(result);
                });
            }
        });
    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.get('/:skip/:limit', getAppointmentsEmailQueue);

    return router;
};