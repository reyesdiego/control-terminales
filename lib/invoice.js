/**
 * Created by diego on 9/17/15.
 */
'use strict'

var moment = require("moment"),
    async = require("async");

/**
 * Representa un comprobante.
 * @constructor
 * @param {string} terminal - Terminal donde pertenece el/los comprobantes.
 */
var invoice = function (terminal) {
    var Invoice = require('../models/invoice.js');

    this.terminal = terminal;

    this.getInvoicesList = function (filtro, withSkipLimit, callback) {
        var param = {},
            result,
            fecha,
            invoice,
            states,
            order,
            skip,
            limit,
            tasksAsync = [],
            taskAsync;

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

        param.terminal = this.terminal;

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

            if (withSkipLimit) {
                limit = parseInt(withSkipLimit.limit, 10);
                skip = parseInt(withSkipLimit.skip, 10);
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
                    callback(err.message);
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
            callback(undefined,  result);
        });

    };

    this.getTotalList = function (param, callback) {
        var invoices,
            Enumerable = require('linq'),
            paramLocal,
            top;

        if (param.top) {
            top = parseInt(param.top, 10);
            delete param.top;
        }
        paramLocal = [
            {$match: param},
            {$project: {
                terminal: 1,
                razon: 1,
                importe: 1,
                fecha: 1
            }},
            {$group: {
                _id: {
                    terminal: "$terminal",
                    razon: "$razon"
                },
                total: {$sum: "$importe.total"},
                cnt: {$sum: 1},
                avg: {$avg: "$importe.total"}
            }},
            {$project: {
                _id: false,
                terminal: "$_id.terminal",
                razon: "$_id.razon",
                total: "$total",
                cnt: '$cnt',
                avg: '$avg'
            }},
            {$sort: {"total": -1}}
        ];
        if (top) {
            paramLocal.push({$limit: top});
        }

        invoices = Invoice.aggregate(paramLocal);

        invoices.exec(function (err, data) {
            var total,
                result;

            if (err) {
                callback(err);
            } else {
                total = Enumerable.from(data)
                    .sum('$.total');

                result = {
                    status: "OK",
                    data: data,
                    total: total,
                    totalCount: data.length
                }
                callback(err, result);
            }
        });
    };

    this.getTotal = function (param, callback) {
        var invoices;

        invoices = Invoice.aggregate([
            {$match: param},
            {$project: {
                terminal: 1,
                importe: 1,
                fecha: 1
            }},
            {$group: {
                _id: {
                    terminal: "$terminal"
                },
                total: {$sum: "$importe.total"},
                cnt: {$sum: 1},
                avg: {$avg: "$importe.total"}
            }},
            {$project: {
                _id: false,
                terminal: "$_id.terminal",
                total: "$total",
                cnt: '$cnt',
                avg: '$avg'
            }}
        ]);
        invoices.exec(function (err, data) {
            var result;

            result = {
                status: "OK",
                data: data,
                totalCount: data.length
            }
            callback(err, result);
        });
    };
};

invoice.prototype = {
    /**
     * Obtiene un JSON con el listado de comprobantes
     * html 5 is used, causing self-closing tags to end with ">" vs "/>",
     * and boolean attributes are not mirrored
     *
     * @param {Object} param - Objeto Filtro.
     * @param {string} param.terminal - Nombre de la terminal.
     * @param {date} param.fechaInicio - Fecha inicial de Emision
     * @param {date} param.fechaFin - Fecha final de Emision.
     * @param {number} param.nroPtoVenta - Numero del punto de venta
     * @api public
     */
    getInvoices: function (param, callback) {
        this.getInvoicesList(param, {skip: param.skip, limit: param.limit}, function (err, result){
            callback(err, result);
        });
    },

    getInvoicesCSV: function (param, callback) {
        this.getInvoicesList(param, param.cuantos,  function (err, result) {
            var State = require('../models/state.js');
            var response = "PTO_VENTA|TIPO_COMPROBANTE|COMPROBANTE|CLIENTE|FECHA|IMPORTE|ESTADO\n";

            State.asKeyValue(function (err, states) {
                result.data.forEach(function (item) {
                    response = response +
                        item.nroPtoVenta +
                        "|" +
                        global.cache.voucherTypes[item.codTipoComprob] +
                        "|" +
                        item.nroComprob +
                        "|" +
                        item.razon +
                        "|" +
                        moment(item.fecha.emision).format("DD/MM/YYYY") +
                        "|" +
                        item.importe.total +
                        "|" +
                        states[item.estado[0].estado].description +
                        "\n";
                });
                callback(err, response);
            });
        });
    },

    getTotalByClient: function (clients, desde, hasta, callback) {
        var param,
            clientArr = [],
            self = this;

        param = {
            'fecha.emision': {$gte: desde, $lte: hasta}
        };
        if (this.terminal !== undefined && this.terminal != null) {
            param.terminal = this.terminal;
        }
        if (typeof clients === 'string') {
            clientArr.push(clients);
        } else {
            clientArr = clients;
        }
        this.getTotal(param, function (err, dataTotal) {
            param.razon = {$in: clientArr};

            self.getTotalList(param, function (err, data) {
                data.total = dataTotal.data[0].total;
                callback(err,  data);
            })
        });
    },

    getTotalByClientTop: function (top, desde, hasta, callback) {
        var param,
            self = this;

        param = {
            'fecha.emision': {$gte: desde, $lte: hasta}
        };
        if (this.terminal !== undefined && this.terminal != null) {
            param.terminal = this.terminal;
        }
        this.getTotal(param, function (err, dataTotal) {
            if (typeof top === 'string') {
                param.top = top;
            }
            self.getTotalList(param, function (err, data) {
                data.total = dataTotal.data[0].total;
                callback(err, data);
            });
        });
    }
};

module.exports = invoice;
