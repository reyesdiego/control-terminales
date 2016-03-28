/**
 * Created by Diego Reyes on 3/21/14.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Invoice = require('../models/invoice.js'),
        Gate = require('../lib/gate.js'),
        Appointment = require('../models/appointment.js'),
        util = require('util'),
        config = require('../config/config.js'),
        linq = require('linq'),
        async = require('async');

    Gate = new Gate();

    function getGates(req, res) {

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
            param.tren = {$exists: true};
            if (req.query.tren) {
                param.tren = req.query.tren;
            }
        }

        if (req.query.patenteCamion) {
            param.patenteCamion = req.query.patenteCamion;
        }

        if (req.query.ontime === '1') {
            param.$where = 'this.gateTimestamp>=this.turnoInicio && this.gateTimestamp<=this.turnoFin';
        } else if (req.query.ontime === '0') {
            param.$where = 'this.gateTimestamp<this.turnoInicio || this.gateTimestamp>this.turnoFin';
        }

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        param.limit = parseInt(req.params.limit, 10);
        param.skip = parseInt(req.params.skip, 10);
        param.order = req.query.order;

        log.time("logTime");
        Gate.getGates(param, function (err, data) {
            let timeEnd = log.timeEnd("logTime");
            if (err) {
                err.time = timeEnd;
                res.status(500).send(err);
            } else {
                data.time = timeEnd;
                res.status(200).send(data);
            }
        });
    }

    function getGatesByHour(req, res){

        var params = {
            fechaInicio: null,
            fechaFin: null,
            fecha: null
        };

        if (req.query.fechaInicio) {
            params.fechaInicio = moment(req.query.fechaInicio, ['YYYY-MM-DD']).format('YYYY-MM-DD');
        }

        if (req.query.fechaFin) {
            params.fechaFin = moment(req.query.fechaFin, ['YYYY-MM-DD']).add(1, 'days').format('YYYY-MM-DD');
        }

        if (req.query.fecha !== undefined) {
            params.fechaInicio = moment(req.query.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            params.fechaFin = moment(params.fechaInicio).add(1, 'days').format('YYYY-MM-DD');
        }

        Gate.getByHour(params, function (err, data) {
            let result;
            if (err) {
                result = {
                    status: 'ERROR',
                    message: err.message
                };
                res.status(200).send(result);
            } else {
                result = {
                    status: 'OK',
                    data: data
                };
                res.status(200).send(result);
            }
        });
    }

    function getGatesByMonth(req, res) {

        var params = {
                fechaInicio: null,
                fechaFin: null,
                fecha: null
            },
            date = moment(moment().format("YYYY-MM-DD"));

        if (req.query.fecha !== undefined) {
            date = moment(moment(req.query.fecha).format("YYYY-MM-DD"));
        }
        params.fechaInicio = moment([date.year(), date.month(), 1]).subtract(4, 'months').format("YYYY-MM-DD");
        params.fechaFin = moment([date.year(), date.month(), 1]).format("YYYY-MM-DD");
        Gate.getByMonth(params, function (err, data) {
            let result;
            if (err) {
                result = {
                    status: 'ERROR',
                    message: err.message
                };
                res.status(200).send(result);
            } else {
                result = {
                    status: 'OK',
                    data: data
                };
                res.status(200).send(result);
            }
        });
    }

    function getDistincts(req, res) {

        var usr = req.usr,
            param = {};

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

            Gate.getDistinct(param, function (err, data) {
                if (err) {
                    res.status(500).send({status: 'ERROR', data: err.message});
                } else {
                    res.status(200).send({
                        status: 'OK',
                        totalCount: data.length,
                        data: data.sort()
                    });
                }
            });
        } else {
            res.status(400).send({status: 'ERROR', message: 'El ruta es inválida', data: []});
        }
    }

    function getMissingGates(req, res) {
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
        Gate.getMissingGates(param, function (err, data) {

            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
                res.flush();
            }
        });
    }
    function getMissingGatesORI(req, res) {

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
    }

    function getMissingInvoices(req, res) {
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
        }
        Gate.getMissingInvoices(param, function (err, data) {

            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
                res.flush();
            }
        });
    }

    function getMissingAppointments(req, res) {

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

        Gate.find(param, {contenedor: 1, gateTimestamp: 1, _id: 0}, function (err, gates) {
            if (err) {
                res._status(500).send({
                    status: "ERROR",
                    message: "Error obteniendo Gates"
                });
            } else {
                delete param.gateTimestamp;
                Appointment.distinct('contenedor', param,  function (err, appointmens) {
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
    }
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
            res.status(403).send({status: 'ERROR', data: errMsg});
        } else {
            next();
        }
    });

    router.get('/:terminal/:skip/:limit', getGates);
    router.get('/ByHour', getGatesByHour);
    router.get('/ByMonth', getGatesByMonth);
    router.get('/:terminal/missingGates', getMissingGates);
    router.get('/:terminal/missingInvoices', getMissingInvoices);
    router.get('/:terminal/missingAppointments', getMissingAppointments);
    router.get('/:terminal/ships', getDistincts);
    router.get('/:terminal/trains', getDistincts);

    return router;
};