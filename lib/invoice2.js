/**
 * Created by diego on 2/12/16.
 */
'use strict';

var Constantes = require('./constantes.js');

class InvoiceOracle {
    constructor (connection) {
        this.cn = connection;
    }

    getInvoice (params, callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            strWhere,
            result;
        var tasksAsync = [],
            taskAsync,
            async = require('async');

        if (pool) {
            taskAsync = function (asyncCallback) {
               pool.getConnection(function (err, connection) {
                   if (err) {
                       console.log("%s, Error en Oracle getInvoice.", new Date());
                       self.cn.doRelease(connection);
                       if (callback) return callback({status: "ERROR", message: "Error en Oracle getInvoice", data: err});
                   } else {

                       strSql = "SELECT ID, " +
                           "TERMINAL, " +
                           "COD_TIPO_COMPROB, " +
                           "NRO_PTO_VENTA, " +
                           "NRO_COMPROB, " +
                           "COD_TIPO_AUTORIZ, " +
                           "COD_AUTORIZ, " +
                           "COD_TIPO_DOC, " +
                           "NRO_DOC, " +
                           "CLIENT_ID, " +
                           "RAZON, " +
                           "IMPORTE_GRAVADO, " +
                           "IMPORTE_NO_GRAVADO, " +
                           "IMPORTE_EXENTO, " +
                           "IMPORTE_IVA, " +
                           "IMPORTE_SUBTOTAL, " +
                           "IMPORTE_OTROS_TRIBUTOS, " +
                           "IMPORTE_TOTAL, " +
                           "TOTAL, " +
                           "COD_MONEDA, " +
                           "COTI_MONEDA, " +
                           "OBSERVA, " +
                           "COD_CONCEPTO, " +
                           "FECHA_EMISION, " +
                           "FECHA_VCTO, " +
                           "FECHA_DESDE, " +
                           "FECHA_HASTA, " +
                           "FECHA_VCTO_PAGO, " +
                           "RESEND " +
                           "FROM INVOICE_HEADER " +
                           " WHERE ID = :1";
                       connection.execute(strSql, [params._id], {}, function (err, data) {
                           self.cn.doRelease(connection);
                           if (err) {
                               return asyncCallback(err);
                           } else {
                               if (data.rows) {
                                   data = data.rows.map(function (item) {
                                       return {
                                           _id: item.ID,
                                           terminal: item.TERMINAL,
                                           codTipoComprob: item.COD_TIPO_COMPROB,
                                           nroPtoVenta: item.NRO_PTO_VENTA,
                                           nroComprob: item.NRO_COMPROB,
                                           codTipoAutoriz: item.COD_TIPO_AUTORIZ,
                                           codAutoriz: item.COD_AUTORIZ,
                                           codTipoDoc: item.COD_TIPO_DOC,
                                           nroDoc: item.NRO_DOC,
                                           client_id: item.client_id,
                                           razon: item.RAZON,
                                           importe: {
                                               gravado: item.IMPORTE_GRAVADO,
                                               noGravado: item.IMPORTE_NO_GRAVADO,
                                               exento: item.IMPORTE_EXENTO,
                                               subtotal: item.IMPORTE_SUBTOTAL,
                                               iva: item.IMPORTE_IVA,
                                               importe_otros_tributos: item.IMPORTE_OTROS_TRIBUTOS,
                                               total: item.IMPORTE_TOTAL
                                           },
                                           total: item.TOTAL,
                                           codMoneda: item.COD_MONEDA,
                                           cotiMoneda: item.COTI_MONEDA,
                                           observa: item.OBSERVA,
                                           codConcepto: item.COD_CONCEPTO,
                                           fecha: {
                                               emision: item.FECHA_EMISION,
                                               vcto: item.FECHA_VCTO,
                                               desde: item.FECHA_DESDE,
                                               hasta: item.FECHA_HASTA,
                                               vctoPago: item.FECHA_VCTO_PAGO
                                           },
                                           comments: [],
                                           estado: [
                                               {
                                                   "grupo": "ALL",
                                                   "user": "t4",
                                                   "_id": "56c5a1dbb5163b4d5f00b027",
                                                   "estado": "Y"
                                               }
                                           ],
                                           otrosTributos: []
                                       };
                                   });
                               }
                               return asyncCallback(undefined, data);
                           }
                       });
                   }
               });
           };
            tasksAsync.push(taskAsync);
            taskAsync = function (asyncCallback) {
                pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log("%s, Error en Oracle getInvoice.", new Date());
                        self.cn.doRelease(connection);
                        if (callback) return callback({status: "ERROR", message: "Error en Oracle getInvoice", data: err});
                    } else {

                        strSql = "SELECT ID, " +
                            "INVOICE_HEADER_ID, " +
                            "CONTENEDOR, " +
                            "IMO, " +
                            "BUQUE_CODIGO, " +
                            "BUQUE_NOMBRE, " +
                            "BUQUE_VIAJE, " +
                            "BUQUE_FECHA, " +
                            "CODE, " +
                            "CNT, " +
                            "UNI_MED, " +
                            "IMP_UNIT, " +
                            "IMP_TOT " +
                            "FROM INVOICE_DETAIL " +
                            " WHERE INVOICE_HEADER_ID = :1";
                        connection.execute(strSql, [params._id], {}, function (err, data) {
                            self.cn.doRelease(connection);
                            if (err) {
                                return asyncCallback(err);
                            } else {
                                if (data.rows) {
                                    data = data.rows.map(function (item) {
                                        return {
                                            id: item.CODE,
                                            contenedor: item.CONTENEDOR,
                                            imo: item.IMO,
                                            cnt: item.CNT,
                                            uniMed: item.UNI_MED,
                                            impUnit: item.IMP_UNIT,
                                            impTot: item.IMP_TOT

                                            //"buque" : {
                                            //    "codigo" : "1CM",
                                            //    "nombre" : "MAERSK LANCO",
                                            //    "viaje" : "1602",
                                            //    "fecha" : "2016-02-21T00:00:00.000-03:00"
                                            //}
                                        };
                                    });
                                }
                                return asyncCallback(undefined, data);
                            }
                        });
                    }
                });
            };
            tasksAsync.push(taskAsync);

            async.parallel(tasksAsync, function (err, data) {
                var header = data[0];
                var details = data[1];
                var result = {};
                console.log("DETAIL %j", data[1]);

                header.detalle = data[1];

                result = {
                    status: 'OK',
                    data: header
                };
                if (callback) return callback( err, result);
            });
        }
    }

    getInvoices (params, callback) {
        var self = this;
        var pool = self.cn.pool;
        var async = require('async');
        var tasksAsync = [],
            taskAsync;
        var strSql,
            strWhere,
            result;
        var skip,
            limit,
            orderBy = ' ID ';

        skip = parseInt(params.skip);
        limit = parseInt(params.limit);
//            tipoResultado = oracle.oracledb.ARRAY;

        //orderBy = this.cn.orderBy(params.order);

        if (pool) {
            taskAsync = function (asyncCallback) {
                pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log("%s, Error en Oracle getInvoices.", new Date());
                        self.cn.doRelease(connection);
                        asyncCallback({status: "ERROR", message: "Error en Oracle getInvoices"});
                    } else {

                        strSql = "SELECT * FROM " +
                            "(SELECT " +
                            "   ID, " +
                            "   TERMINAL, " +
                            "   COD_TIPO_COMPROB, " +
                            "   NRO_PTO_VENTA, " +
                            "   RAZON, " +
                            "   FECHA_EMISION, " +
                            "   NRO_COMPROB, " +
                            "   IMPORTE_TOTAL, " +
                            "   ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                            "FROM INVOICE_HEADER ) " +
                            "WHERE R BETWEEN :1 and :2";

                        connection.execute(strSql, [skip, skip + limit], {}, function (err, data) {
                            self.cn.doRelease(connection);
                            if (err) {
                                asyncCallback(err);
                            } else {
                                if (data.rows) {
                                    result = {
                                        status: "OK"
                                    };
                                    result.data = data.rows.map(function (item) {
                                        return {
                                            _id: item.ID,
                                            terminal: item.TERMINAL,
                                            codTipoComprob: item.COD_TIPO_COMPROB,
                                            nroComprob: item.NRO_COMPROB,
                                            razon: item.RAZON,
                                            importe: {total: item.IMPORTE_TOTAL},
                                            fecha: {emision: item.FECHA_EMISION},
                                            nroPtoVenta: item.NRO_PTO_VENTA
                                        };
                                    });
                                }
                                asyncCallback(undefined, result);
                            }
                        });
                    }
                });
            };
            tasksAsync.push(taskAsync);

            taskAsync = function (asyncCallback) {
                pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log("%s, Error en Oracle getInvoices.", new Date());
                        self.cn.doRelease(connection);
                        asyncCallback({status: "ERROR", message: "Error en Oracle getInvoices"});
                    } else {

                        strSql = "SELECT count(*) TOTAL " +
                            "FROM INVOICE_HEADER " +
                            "WHERE TERMINAL = :1";

                        connection.execute(strSql, [params.terminal], {}, function (err, data) {
                            self.cn.doRelease(connection);
                            if (err) {
                                asyncCallback(err);
                            } else {
                                let total = 0;
                                if (data.rows) {
                                    total = data.rows[0].TOTAL;
                                }
                                asyncCallback(undefined, total);
                            }
                        });
                    }
                });
            };
            tasksAsync.push(taskAsync);

            async.parallel(tasksAsync, function (err, data) {
                var result = data[0];
                if (data[1]) {
                    result.totalCount = data[1];
                }
                callback(err, result);
            });
        }
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
        this.payings = require('../models/paying.js');
    }
    getInvoice (params, callback) {
        var param = {
                _id: params._id
            },
            invoice;

        if (params.terminal)
            param.terminal = params.terminal;

        invoice = this.model.find(param);
        invoice.populate({path: 'payment'});
        invoice.exec(function(err, invoices){
            if (err) {
                if (callback) return callback({status:'ERROR', message: err.message, data: err});
            } else {
                if (callback) return callback(undefined, {status:"OK", data: invoices[0]||null});
            }
        });
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
            invoice = Invoice.find(param, {
                nroPtoVenta: 1,
                codTipoComprob: 1,
                nroComprob: 1,
                razon: 1,
                'importe.total': 1,
                //'detalle': 1,
                estado:1,
                fecha: 1
            });
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

    getDistinct (params, callback) {
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

    getInvoice (params, callback) {
        this.clase.getInvoice(params, callback);
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