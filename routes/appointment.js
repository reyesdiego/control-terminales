/**
 * Created by Diego Reyes on 3/21/14.
 */
//@ts-check
"use strict";

module.exports = log => {

    var express = require("express"),
        router = express.Router(),
        moment = require("moment"),
        Account = require("../models/account"),
        config = require("../config/config.js");

    var _Appointment = require("../lib/appointment.js");
    const Appointment = new _Appointment();

    function getAppointments(req, res) {

        var params = {
            usr: req.usr,
            contenedor: req.query.contenedor,
            buque: req.query.buqueNombre,
            viaje: req.query.viaje,
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin,
            mov: req.query.mov,
            email: req.query.email,
            terminal: req.params.terminal
        };
        var options = {
            limit: parseInt(req.params.limit, 10),
            skip: parseInt(req.params.skip, 10),
            order: req.query.order
        };

        log.time("getAppointments");
        Appointment.getAppointments(params, options)
            .then(data => {
                log.timeEnd("getAppointments");
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("Error: %s", err.error);
                res.status(500).send(err);
            });

    }

    let getAppointmentById = (req, res) => {

        if (req.params._id === undefined) {
            res.status(400).send({ status: "ERROR", data: "Debe proveer el dato del id para obtener el turnos." });
        } else {

            Appointment.getById(req.params._id)
                .then(data => {
                    res.status(200).send(data);
                })
                .catch(err => {
                    res.status(500).send({ status: "ERROR", data: err.message });
                });
        }
    };

    function getAppointmentsByHour(req, res) {

        var seneca = require("seneca")({ timeout: config.microService.statisticMongo.timeout });
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
            param.fechaInicio = moment(moment(req.query.fecha, ["YYYY-MM-DD"])).toDate();
            param.fechaFin = moment(param.fechaInicio).add(1, "days").toDate();
        }

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    let getAppointmentsByDay = (req, res) => {

        var seneca = require("seneca")({ timeout: config.microService.statisticMongo.timeout });
        seneca.client(config.microService.statisticMongo.port, config.microService.statisticMongo.host);

        var usr = req.usr;
        var moment = require("moment");

        var param = {
            role: "statistic",
            cmd: "getCountByDay",
            entity: "appointment"
        };

        if (req.query.fechaInicio) {
            param.fechaInicio = req.query.fechaInicio;
        }

        if (req.query.fechaFin) {
            param.fechaFin = req.query.fechaFin;
        }

        if (req.query.fecha !== undefined) {
            param.fechaInicio = moment(moment(req.query.fecha, ["YYYY-MM-DD"])).toDate();
            param.fechaFin = moment(param.fechaInicio).add(1, "days").toDate();
        }

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    };

    function getAppointmentsByMonth(req, res) {

        var seneca = require("seneca")({ timeout: config.microService.statisticMongo.timeout });
        seneca.client(config.microService.statisticMongo.port, config.microService.statisticMongo.host);

        var date;

        var param = {
            role: "statistic",
            cmd: "getCountByMonth",
            entity: "appointment"
        };

        date = moment().subtract(moment().date() - 1, "days").format("YYYY-MM-DD");
        if (req.query.fecha !== undefined) {
            date = moment(req.query.fecha, "YYYY-MM-DD").format("YYYY-MM-DD");
        }
        var monthsAgo = 4;
        if (req.query.monthsAgo) {
            monthsAgo = req.query.monthsAgo;
        }

        param.fecha = date;
        param.monthsAgo = monthsAgo;

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    function getByContainer(req, res) {
        var params = {
            email: req.query.email,
            _id: req.query._id,
            contenedor: req.params.container
        };

        Appointment.getByContainer(params)
            .then(data => {
                if (data.data.length === 1) {
                    let turno = data.data[0];
                    Account.findOne({ full_name: { $nin: ["Daniel Bruzon"] }, terminal: turno.terminal }, (err, account) => {
                        turno.full_name = account.full_name;
                        res.render("comprobanteTurno.jade", turno, (err, html) => {
                            res.status(200).send(html);
                        });
                    });
                } else {
                    res.status(200).send(data);
                }
            })
            .catch(err => {
                res.status(500).send(err);
            });
    }

    let getByPatente = (req, res) => {
        var param = {
            patenteCamion: req.params.patente.toUpperCase(),
            inicio: { $gte: moment(moment().format("YYYY-MM-DD")).toDate() }
        };

        Appointment.getByPatente(param)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getDistincts = (req, res) => {

        var usr = req.usr,
            distinct = "",
            params = {};

        if (req.route.path === "/:terminal/ships") {
            params.distinct = "buque";
        }

        if (usr.role === "agp") {
            params.terminal = req.params.terminal;
        } else {
            params.terminal = usr.terminal;
        }

        if (params.distinct !== "") {
            log.time("getDistincts " + params.distinct);
            Appointment.getDistinct(params.distinct, params, (err, data) => {
                log.time("getDistincts " + params.distinct);
                if (err) {
                    res.status(500).send({ status: "ERROR", data: err });
                } else {
                    res.status(200).send({ status: "OK", totalCount: data.length, data: data.sort() });
                }
            });
        } else {
            res.status(400).send({ status: "ERROR", message: "El ruta es inválida", data: [] });
        }
    };

    function getMissingAppointments(req, res) {
        var usr = req.usr,
            param = {};

        if (usr.role === "agp") {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        Appointment.getMissingAppointments(param)
            .then(data => {
                res.status(200).send(data);
                res.flush();
            })
            .catch(err => {
                res.status(500).send(err);
            });
    }

    router.param("terminal", function (req, res, next, terminal) {
        var usr = req.usr;

        if (usr.terminal !== "AGP" && usr.terminal !== terminal) {
            var errMsg = "La terminal recibida por parámetro es inválida para el token.";
            log.logger.error(errMsg);
            res.status(403).send({ status: "ERROR", data: errMsg });
        } else {
            next();
        }
    });

    router.get("/ById/:_id", getAppointmentById);
    router.get("/ByHour", getAppointmentsByHour);
    router.get("/ByMonth", getAppointmentsByMonth);
    router.get("/ByDay", getAppointmentsByDay);
    router.get("/:terminal/:skip/:limit", getAppointments);
    router.get("/:terminal/containers", getDistincts);
    router.get("/:terminal/ships", getDistincts);
    router.get("/container/:container", getByContainer);
    router.get("/:terminal/missingAppointments", getMissingAppointments);
    router.get("/patente/:patente", getByPatente);

    return router;
};