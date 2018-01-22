/**
 * Created by Diego Reyes on 3/21/14.
 */

module.exports = (log, oracle) => {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Gate = require('../lib/gate.js'),
        Appointment = require('../models/appointment.js'),
        util = require('util'),
        config = require('../config/config.js'),
        linq = require('linq'),
        async = require('async');

    Gate = new Gate(oracle);

    let getById = async (req, res) => {
        const id = req.params.id;
        log.time("getGateByID");
        try {
            let data = await Gate.getById(id);
            data.time = log.timeEnd("getGateByID");
            res.status(200).send(data);
        } catch (err) {
            err.time = log.timeEnd("getGateByID");
            res.status(500).send(err);
        }
    };

    let getGates = async (req, res) => {

        var usr = req.usr,
            fecha,
            param = {};

        if (req.query.fechaInicio || req.query.fechaFin) {
            param.gateTimestamp = {};
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.gateTimestamp.$gte = fecha;
                param.fechaInicio = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.gateTimestamp.$lt = fecha;
                param.fechaFin = fecha;
            }
        }

        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.buqueNombre) {
            param.buque = req.query.buqueNombre;
        }

        if (req.query.viaje) {
            param.viaje = req.query.viaje;
        }

        if (req.query.mov) {
            param.mov = req.query.mov;
        }

        if (req.query.carga) {
            param.carga = req.query.carga;
        }

        if (req.query.tren) {
            param.tren = req.query.tren;
        }

        if (req.query.onlyTrains === '1') {
            param.tren = { $exists: true };
            if (req.query.tren) {
                param.tren = req.query.tren;
            }
        }

        if (req.query.patenteCamion) {
            param.patenteCamion = req.query.patenteCamion;
        }

        if (req.query.ontime === '1') {
            param.ontime = req.query.ontime;
            param.$where = 'this.gateTimestamp>=this.turnoInicio && this.gateTimestamp<=this.turnoFin';
        } else if (req.query.ontime === '0') {
            param.ontime = req.query.ontime;
            param.$where = 'this.gateTimestamp<this.turnoInicio || this.gateTimestamp>this.turnoFin';
        }

        if (req.query.size) {
            param.size = req.query.size;
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        param.limit = parseInt(req.params.limit, 10);
        param.skip = parseInt(req.params.skip, 10);
        param.order = req.query.order;

        log.time("getGates");
        try {

            if (param.skip >= 0 && param.limit >= 0) {
                let data = await Gate.getGates(param);
                data.time = log.timeEnd("getGates");
                res.status(200).send(data);
            } else {
                let data = await Gate.getGatesCSV(param);
                data.time = log.timeEnd("getGates");
                res.header("content-type", "text/csv");
                res.header(
                    "content-disposition",
                    "attachment; filename=report.csv"
                );
                res.status(200).send(data.data);
            }
        } catch (err) {
            err.time = log.timeEnd("getGates");
            res.status(500).send(err);
        }

    };

    let getGatesInOrOut = async (req, res) => {

        var usr = req.usr,
            fecha,
            param = {};

        if (req.query.fechaInicio || req.query.fechaFin) {
            param.gateTimestamp = {};
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.gateTimestamp.$gte = fecha;
                param.fechaInicio = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.gateTimestamp.$lt = fecha;
                param.fechaFin = fecha;
            }
        }

        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.buqueNombre) {
            param.buque = req.query.buqueNombre;
        }

        if (req.query.viaje) {
            param.viaje = req.query.viaje;
        }

        if (req.query.carga) {
            param.carga = req.query.carga;
        }

        if (req.query.tren) {
            param.tren = req.query.tren;
        }

        if (req.query.onlyTrains === '1') {
            param.tren = { $exists: true };
            if (req.query.tren) {
                param.tren = req.query.tren;
            }
        }

        if (req.query.patenteCamion) {
            param.patenteCamion = req.query.patenteCamion;
        }

        if (req.query.ontime === '1') {
            param.ontime = req.query.ontime;
            param.$where = 'this.gateTimestamp>=this.turnoInicio && this.gateTimestamp<=this.turnoFin';
        } else if (req.query.ontime === '0') {
            param.ontime = req.query.ontime;
            param.$where = 'this.gateTimestamp<this.turnoInicio || this.gateTimestamp>this.turnoFin';
        }

        if (req.query.size) {
            param.size = req.query.size;
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        param.limit = parseInt(req.params.limit, 10);
        param.skip = parseInt(req.params.skip, 10);
        param.order = req.query.order;

        log.time("getGatesInOrOut");
        try {
            let data = await Gate.getGatesInOrOut(param);
            data.time = log.timeEnd("getGatesInOrOut");
            res.status(200).send(data);
        } catch (err) {
            err.time = log.timeEnd("getGatesInOrOut");
            res.status(500).send(err);
        }

    };

    let getGatesByHour = (req, res) => {

        var seneca = require("seneca")();

        seneca.client({ port: config.microService.statisticOracle.port, host: config.microService.statisticOracle.host, timeout: 60000 });

        var param = {
            role: "statistic",
            cmd: "getCountByHour",
            entity: "gate"
        };

        if (req.query.fechaInicio) {
            param.fechaInicio = moment(req.query.fechaInicio, ['YYYY-MM-DD']).format('YYYY-MM-DD');
        }

        if (req.query.fechaFin) {
            param.fechaFin = moment(req.query.fechaFin, ['YYYY-MM-DD']).add(1, 'days').format('YYYY-MM-DD');
        }

        if (req.query.fecha !== undefined) {
            param.fechaInicio = moment(req.query.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            param.fechaFin = moment(param.fechaInicio).add(1, 'days').format('YYYY-MM-DD');
        }

        log.time("getByHour");
        seneca.act(param, (err, data) => {
            if (err) {
                err.time = log.timeEnd("getByHour");
                res.status(500).send({
                    status: "ERROR",
                    message: err.msg,
                    data: err
                });
            } else {
                data.time = log.timeEnd("getByHour");
                res.status(200).send(data);
            }
        });
    };

    let getGatesByHourMov = (req, res) => {

        var seneca = require("seneca")();
        seneca.client({ port: config.microService.statisticOracle.port, host: config.microService.statisticOracle.host, timeout: 60000 });

        var param = {
            role: "statistic",
            cmd: "getCountByHourMov",
            entity: "gate"
        };

        param.terminal = req.params.terminal;

        if (req.query.fechaInicio) {
            param.fechaInicio = moment(req.query.fechaInicio, ['YYYY-MM-DD']).format('YYYY-MM-DD');
        }

        if (req.query.fechaFin) {
            param.fechaFin = moment(req.query.fechaFin, ['YYYY-MM-DD']).add(1, 'days').format('YYYY-MM-DD');
        }

        if (req.query.fecha !== undefined) {
            param.fechaInicio = moment(req.query.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            param.fechaFin = moment(param.fechaInicio).add(1, 'days').format('YYYY-MM-DD');
        }

        log.time("getByHourMov");
        seneca.act(param, (err, data) => {
            if (err) {
                err.time = log.timeEnd("getByHourMov");
                res.status(500).send({
                    status: "ERROR",
                    message: err.msg,
                    data: err
                });
            } else {
                data.time = log.timeEnd("getByHourMov");
                res.status(200).send(data);
            }
        });
    };

    let getGatesByDay = (req, res) => {

        var seneca = require("seneca")();
        seneca.client({ port: config.microService.statisticOracle.port, host: config.microService.statisticOracle.host, timeout: 60000 });

        var param = {
            role: "statistic",
            cmd: "getCountByDay",
            entity: "gate"
        };

        if (req.query.fechaInicio) {
            param.fechaInicio = moment(req.query.fechaInicio, ['YYYY-MM-DD']).format('YYYY-MM-DD');
        }

        if (req.query.fechaFin) {
            param.fechaFin = moment(req.query.fechaFin, ['YYYY-MM-DD']).add(1, 'days').format('YYYY-MM-DD');
        }

        if (req.query.fecha !== undefined) {
            param.fechaInicio = moment(req.query.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            param.fechaFin = moment(param.fechaInicio).add(1, 'days').format('YYYY-MM-DD');
        }

        log.time("getByDay");
        seneca.act(param, (err, data) => {
            if (err) {
                err.time = log.timeEnd("getByDay");
                res.status(500).send({
                    status: "ERROR",
                    message: err.msg,
                    data: err
                });
            } else {
                data.time = log.timeEnd("getByDay");
                res.status(200).send(data);
            }
        });
    };

    let getGatesByMonth = (req, res) => {

        var seneca = require("seneca")();
        seneca.client({ port: config.microService.statisticOracle.port, host: config.microService.statisticOracle.host, timeout: 60000 });

        var param = {
            role: "statistic",
            cmd: "getCountByMonth",
            entity: "gate"
        };

        var date = moment(moment().format("YYYY-MM-DD"));

        if (req.query.fecha !== undefined) {
            date = moment(moment(req.query.fecha).format("YYYY-MM-DD"));
        }
        param.fechaInicio = moment([date.year(), date.month(), 1]).subtract(4, 'months').format("YYYY-MM-DD");
        param.fechaFin = moment([date.year(), date.month(), 1]).format("YYYY-MM-DD");

        log.time("getCountByMonth");
        seneca.act(param, (err, data) => {
            if (err) {
                err.time = log.timeEnd("getCountByMonth");
                res.status(500).send(err);
            } else {
                data.time = log.timeEnd("getCountByMonth");
                res.status(200).send(data);
            }
        });

    };

    let getGatesByType = (req, res) => {
        var usr = req.usr,
            fecha,
            param = {};

        if (req.query.fechaInicio || req.query.fechaFin) {
            param.gateTimestamp = {};
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.fechaInicio = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.fechaFin = fecha;
            }
        }

        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.buqueNombre) {
            param.buque = req.query.buqueNombre;
        }

        if (req.query.viaje) {
            param.viaje = req.query.viaje;
        }

        if (req.query.carga) {
            param.carga = req.query.carga;
        }

        if (req.query.tren) {
            param.tren = req.query.tren;
        }

        if (req.query.onlyTrains === '1') {
            param.tren = { $exists: true };
            if (req.query.tren) {
                param.tren = req.query.tren;
            }
        }

        if (req.query.patenteCamion) {
            param.patenteCamion = req.query.patenteCamion;
        }

        if (req.query.ontime === '1') {
            param.ontime = req.query.ontime;
        } else if (req.query.ontime === '0') {
            param.ontime = req.query.ontime;
        }

        if (req.query.size) {
            param.size = req.query.size;
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        log.time("getByType");
        Gate.getByType(param)
            .then(data => {
                log.timeEnd("getByType");
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getDistincts = (req, res) => {

        var usr = req.usr,
            param = {
                terminal: null,
                distinct: null
            };

        if (req.route.path === '/:terminal/ships') {
            param.distinct = 'buque';
        }
        if (req.route.path === '/:terminal/trains') {
            param.distinct = 'tren';
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        if (param.distinct !== '') {

            log.time("getDistincts " + param.distinct);
            Gate.getDistinct(param)
                .then(data => {
                    res.status(200).send({
                        status: 'OK',
                        totalCount: data.length,
                        time: log.timeEnd("getDistincts " + param.distinct),
                        data: data.sort()
                    });
                })
                .catch(err => {
                    res.status(500).send({
                        status: 'ERROR',
                        time: log.timeEnd("getDistincts" + req.route.path),
                        data: err.message
                    });
                });
        } else {
            res.status(400).send({ status: 'ERROR', message: 'El ruta es inválida', data: [] });
        }
    };

    let getLastInsert = (req, res) => {
        var terminal = req.params.terminal;
        var lastHours = req.query.lastHours;

        Gate.getLastInsert(terminal, lastHours)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getMissingGates = (req, res) => {
        var usr = req.usr,
            terminal,
            param,
            fecha;

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }
        param = {
            terminal: terminal,
            skip: parseInt(req.params.skip, 10),
            limit: parseInt(req.params.limit, 10)
        };

        if (req.query.fechaInicio) {
            fecha = moment(req.query.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD');
            param.fechaInicio = fecha;
        }
        if (req.query.fechaFin) {
            fecha = moment(req.query.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD');
            param.fechaFin = fecha;
        }

        log.time("getMissingGates");
        Gate.getMissingGates(param)
            .then(data => {
                data.time = log.timeEnd("getMissingGates");
                res.status(200).send(data);
                res.flush();
            })
            .catch(err => {
                err.time = log.timeEnd("getMissingGates");
                res.status(500).send(err);
            });
    };

    /*function getMissingGatesORI(req, res) {

        var Gate = require('../models/gate.js');
        var usr = req.usr,
            terminal = '',
            _price,
            _rates,
            taskAsync,
            tasksAsync = [];

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }

        _price = require('../include/price.js');
        _rates = new _price.price(terminal);
        _rates.rates(function (err, rates) {
            let invoicesWo,
                gatesWo;
            log.time("totalTime");

            taskAsync = function (asyncCallback) {
                var invoices = Invoice.aggregate([
                    {$match: {terminal: terminal, codTipoComprob: 1, 'detalle.items.id': {$in: rates}}},
                    //{$project: {detalle: 1, fecha: '$fecha.emision'}},
                    {$project: {
                        //detalle: 1,
                        code: '$detalle.items.id',
                        contenedor: '$detalle.contenedor',
                        fecha: '$fecha.emision'}
                    },
                    //{$unwind: '$detalle'},
                    //{$unwind: '$detalle.items'},
                    {$unwind: '$contenedor'},
                    {$unwind: '$code'},
                    //{$match: {'detalle.items.id': {$in: rates}}},
                    {$match: {'code': {$in: rates}}},
                    {$project: {
                        //_id: false,
                        //c: '$detalle.contenedor',
                        c: '$contenedor',
                        f: '$fecha'}}
                ]);

                //if (req.query.order) {
                //    order = JSON.parse(req.query.order);
                //    invoices.sort(order[0]);
                //} else {
                //    invoices.sort({codTipoComprob: 1, nroComprob: 1});
                //}
                log.time("invoiceTime");
                invoices.exec(function (err, dataInvoices) {
                    log.timeEnd("invoiceTime");
                    if (err) {
                        res.status(500).send({status: 'ERROR', data: err.message});
                    } else {
                        invoicesWo = linq.from(dataInvoices);
                        asyncCallback();
                    }
                });
            };
            tasksAsync.push(taskAsync);

            taskAsync = function (asyncCallback) {
                log.time("gateTime");
                let gates;
                gates = Gate.find({terminal: terminal, carga: "LL"}, {contenedor: true, _id: false});
                gates.exec(function (err, dataGates) {
                    log.timeEnd("gateTime");
                    if (err) {
                        res.status(500).send({status: 'ERROR', data: err.message});
                    } else {
                        gatesWo = linq.from(dataGates).select("{c: $.contenedor}");
                        asyncCallback();
                    }
                });
            }
            tasksAsync.push(taskAsync);

            async.parallel(tasksAsync, function (err, data) {

                let invoicesWoGates = invoicesWo.except(gatesWo, "$.c").toArray();
                //.except(dataGates).toArray();

                res.status(200)
                    .send({
                        status: 'OK',
                        totalCount: invoicesWoGates.length,
                        data: invoicesWoGates,
                        time: log.timeEnd("totalTime")
                    });
                res.flush();
            });

        });
    }*/

    let getMissingInvoices = (req, res) => {
        var usr = req.usr,
            terminal,
            param;

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }
        param = {
            terminal: terminal
        };

        log.time("getMissingGates");
        Gate.getMissingInvoices(param)
            .then(data => {
                data.time = log.timeEnd("getMissingGates");
                res.status(200).send(data);
                res.flush();
            })
            .catch(err => {
                err.time = log.timeEnd("getMissingGates");
                res.status(500).send(err);
            });
    };

    let getMissingAppointments = (req, res) => {

        var Gate = require('../models/gate.js');
        var usr = req.usr,
            terminal = '',
            fecha,
            param = {};

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }
        param.terminal = terminal;

        if (req.query.fechaInicio || req.query.fechaFin) {
            param.gateTimestamp = {};
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.gateTimestamp.$gte = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, ['YYYY-MM-DD HH:mm Z']).toDate();
                param.gateTimestamp.$lt = fecha;
            }
        }

        Gate.find(param, { contenedor: 1, gateTimestamp: 1, _id: 0 }, function (err, gates) {
            if (err) {
                res._status(500).send({
                    status: "ERROR",
                    message: "Error obteniendo Gates"
                });
            } else {
                delete param.gateTimestamp;
                Appointment.distinct('contenedor', param, function (err, appointmens) {
                    var result;
                    if (err) {
                        res._status(500).send({
                            status: "ERROR",
                            message: "Error obteniendo Gates"
                        });
                    } else {
                        result = linq.from(gates)
                            .except(linq.from(appointmens).select('z=>{contenedor: z}'), '$.contenedor', '$.contenedor')
                            .select('x=>{c: x.contenedor, g: x.gateTimestamp}')
                            .orderBy('$.g')
                            .toArray();
                        res.status(200).send({
                            status: "OK",
                            totalCount: result.length,
                            data: result
                        });
                    }
                });
            }
        });
    };

    let setStatus = async (req, res) => {
        const data = req.body;
        try {
            const result = await Gate.setStatus(data.id, data.status);
            res.status(200).send({
                status: "OK",
                data: result
            });
        } catch (err) {
            res.status(500).send({
                status: "ERROR",
                message: err.message,
                data: err
            })
        }
    };

    let deleteGate = async (req, res) => {
        const data = req.body;
        try {
            const result = await Gate.delete(data.id);
            res.status(200).send({
                status: "OK",
                data: result
            });
        } catch (err) {
            res.status(500).send({
                status: "ERROR",
                message: err.message,
                data: err
            })
        }
    };
    /*
    router.use(function timeLog(req, res, next){
        log.logger.info('Time: %s', Date.now());
        next();
    });
    */

    router.param('terminal', function (req, res, next, terminal) {
        var usr = req.usr;

        if (usr.terminal !== 'AGP' && usr.terminal !== terminal) {
            var errMsg = util.format('%s', 'La terminal recibida por parámetro es inválida para el token.');
            log.logger.error(errMsg);
            res.status(403).send({ status: 'ERROR', data: errMsg });
        } else {
            next();
        }
    });

    router.get('/ById/:id', getById);
    router.get('/:terminal/:skip/:limit', getGates);
    router.get('/:terminal/down', getGates);
    router.get('/IN/:terminal/:skip/:limit', getGatesInOrOut);
    router.get('/ByHour', getGatesByHour);
    router.get('/:terminal/ByHourMov', getGatesByHourMov);
    router.get('/ByDay', getGatesByDay);
    router.get('/ByMonth', getGatesByMonth);
    router.get('/:terminal/ByType', getGatesByType);
    router.get('/:terminal/missingGates/:skip/:limit', getMissingGates);
    router.get('/:terminal/missingInvoices', getMissingInvoices);
    router.get('/:terminal/missingAppointments', getMissingAppointments);
    router.get('/:terminal/ships', getDistincts);
    router.get('/:terminal/trains', getDistincts);
    router.get('/lastInsert/:terminal', getLastInsert);
    router.post('/setStatus', setStatus);
    router.post('/delete', deleteGate);

    return router;
};