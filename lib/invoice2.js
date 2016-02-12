/**
 * Created by diego on 2/12/16.
 */
'use strict';

var Constantes = require('./constantes.js');

class InvoiceOracle {
    constructor (connection) {
        this.cn = connection;
    }
    getInvoices (params, callback) {
    }

    getDistinct (params, callback) {

    }
/*
    add (gate, callback) {
        var self = this;
        var strSql,
            values;
        var pool = self.cn.pool;
        var moment = require("moment");

        if (pool) {
            pool.getConnection(function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle add Gate.", new Date());
                    if (callback) return callback(err);
                } else {
                    strSql = "insert into GATES " +
                        "(ID," +
                        "TERMINAL," +
                        "BUQUE," +
                        "VIAJE," +
                        "CONTENEDOR," +
                        "CARGA," +
                        "MOV," +
                        "TIPO," +
                        "GATETIMESTAMP," +
                        "TURNOINICIO," +
                        "TURNOFIN," +
                        "PATENTECAMION," +
                        "TREN) VALUES (" +
                        "gates_seq.nextval," +
                        " :terminal, :buque, :viaje, :contenedor, :carga, :mov, :tipo, to_date(:gateTimestamp, 'YYYY-MM-DD HH24:MI:SS'), to_date(:turnoInicio, 'YYYY-MM-DD HH24:MI:SS'), to_date(:turnoFin, 'YYYY-MM-DD HH24:MI:SS'), :patenteCamion, :tren)";
                    values = {
                        terminal: gate.terminal,
                        buque: gate.buque,
                        viaje: gate.viaje,
                        contenedor: gate.contenedor,
                        carga: gate.carga,
                        mov: gate.mov,
                        tipo: gate.tipo,
                        gateTimestamp: moment(gate.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"),
                        turnoInicio: (gate.turnoInicio === null ) ? null : moment(gate.turnoInicio).format("YYYY-MM-DD hh:mm:ss"),
                        turnoFin: (gate.turnoFin === null ) ? null : moment(gate.turnoFin).format("YYYY-MM-DD hh:mm:ss"),
                        patenteCamion: gate.patenteCamion,
                        tren: gate.tren
                    };
                    connection.execute(strSql, values, {autoCommit:true}, function(err, result) {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback(err);
                        } else {
                            result = {
                                status: 'OK',
                                data: result
                            };
                            if (callback) return callback(undefined, result);
                        }
                    });

                }
            });
        }
    }
*/
    toString() {
        return "Invoice class on Oracle 11g";
    }

}

class InvoiceMongoDB {
    constructor (model) {
        this.model = model;
    }
    getInvoices (filtro, callback) {
        var param = {},
            result,
            fecha,
            invoice,
            states,
            order,
            skip,
            limit,
            tasksAsync = [],
            taskAsync,
            async = require("async"),
            moment = require("moment");
        var Invoice = this.model;

        if (!filtro) {
            throw "Debe proveer el parametro filtro";
        }

        if (filtro.fechaInicio || filtro.fechaFin) {
            param["fecha.emision"] = {};
            if (filtro.fechaInicio) {
                fecha = moment(filtro.fechaInicio, 'YYYY-MM-DD').toDate();
                param["fecha.emision"]['$gte'] = fecha;
            }
            if (filtro.fechaFin) {
                fecha = moment(filtro.fechaFin, 'YYYY-MM-DD').toDate();
                param["fecha.emision"]['$lte'] = fecha;
            }
        }
        if (filtro.nroPtoVenta) {
            param.nroPtoVenta = filtro.nroPtoVenta;
        }
        if (filtro.codTipoComprob) {
            param.codTipoComprob = filtro.codTipoComprob;
        }
        if (filtro.nroComprobante) {
            param.nroComprob = filtro.nroComprobante;
        }
        if (filtro.razonSocial) {
            param.razon = {$regex: filtro.razonSocial};
        }
        if (filtro.documentoCliente) {
            param.nroDoc = filtro.documentoCliente;
        }

        if (filtro.contenedor) {
            param['detalle.contenedor'] = filtro.contenedor;
        }

        if (filtro.buqueNombre) {
            param['detalle.buque.nombre'] = filtro.buqueNombre;
        }

        if (filtro.viaje) {
            param['detalle.buque.viaje'] = filtro.viaje;
        }

        if (filtro.code) {
            param['detalle.items.id'] = filtro.code;
        }

        if (filtro.payment === '1') {
            param.payment = {$exists: true};
        }

        if (filtro.rates) {
            param['detalle.items.id'] = {$in: filtro.rates};
        }

        if (filtro.estado) {
            states = filtro.estado.split(",");
            param.$or = [
                { estado: {$size: 1, $elemMatch: {estado: {$in: states}, grupo: 'ALL'} } },
                { 'estado.1': { $exists: true }, estado: {$elemMatch: {estado: {$in: states}, grupo: filtro.group} } }
            ];
        }

        if (filtro.resend) {
            param.resend = filtro.resend;
        }

        param.terminal = filtro.terminal;

        result = {
            status: 'OK',
            totalCount: 0,
            pageCount: 0,
            page: 0,
            data: []
        };

        taskAsync = function (asyncCallback) {
            invoice = Invoice.find(param);
            invoice.populate({path: 'payment'});

            if (filtro.order) {
                order = JSON.parse(filtro.order);
                invoice.sort(order[0]);
            } else {
                invoice.sort({codTipoComprob: 1, nroComprob: 1});
            }

            if (filtro.limit) {
                limit = parseInt(filtro.limit, 10);
                skip = parseInt(filtro.skip, 10);
                invoice.skip(skip).limit(limit);
            }

            invoice.lean();
            invoice.exec(function (err, invoices) {
                if (!err) {
                    let pageCount = invoices.length;
                    result.status = 'OK';
                    result.data = invoices;
                    result.pageCount = (limit > pageCount) ? pageCount : limit;
                    result.page = skip;
                    asyncCallback();
                } else {
                    if (callback !== undefined) return callback(err.message);
                }
            });
        }
        tasksAsync.push(taskAsync);

        taskAsync = function (asyncCallback) {
            Invoice.count(param, function (err, cnt) {
                result.totalCount = cnt;
                asyncCallback();
            });
        }
        tasksAsync.push(taskAsync);

        async.parallel(tasksAsync, function (err, data) {
            if (callback !== undefined) return callback(undefined,  result);
        });

    }

    getDistinct(params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };
        this.model.distinct(params.distinct, jsonParam, function (err, data) {
            if (err) {
                if (callback) return callback(err);
            } else {
                if (callback) return callback(undefined, data);
            }
        });
    }
/*
    add (gate, callback) {

        var gate2insert = gate;

        if (gate2insert) {
            this.model.insert(gate2insert, function (errSave, gateNew) {
                var socketMsg;
                if (errSave) {
                    if (callback) callback(errSave);
                } else {
                    socketMsg = {
                        status: 'OK',
                        data: gateNew
                    };
                    if (callback) callback(undefined, socketMsg);
                }
            });
        }
    }
*/
    toString() {
        return "Invoice class on MongoDB";
    }
}

/**
 * Representa un Invoice.
 * @constructor
 * @param {object} connection - Objeto de conexion a la base de datos a implementar.
 */
class Invoice extends Constantes {
    constructor(connection) {
        super();

        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new InvoiceOracle(this.connection);
        } else {
            this.connection = require('../models/invoice.js');
            this.clase = new InvoiceMongoDB(this.connection);
        }
    }

    getInvoices (params, callback) {
        this.clase.getInvoices(params, callback);
    }

    getDistinct (params, callback) {
        this.clase.getDistinct(params, callback);
    }
/*
    add (newGate, options, callback) {

        var validate = {},
            trimBody;
        newGate = JSON.parse(JSON.stringify(newGate));

        if (typeof options === 'function') {
            callback = options;
        } else if (typeof options === 'object') {
            if (options.trim) {
                trimBody = require('trim-body');
                trimBody(newGate);
            }
            if (options.validate) {
                validate = this.validate(newGate);
            }
        }
        if (validate.status === 'ERROR') {
            if (callback) return callback(validate);
        } else {
            this.clase.add(newGate, callback);
        }
    }
*/
    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }
}

module.exports = Invoice;