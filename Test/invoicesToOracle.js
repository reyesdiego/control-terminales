/**
 * Created by diego on 1/27/16.
 */

"use strict";

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");
var dateTime = require('../include/moment');

require('../include/mongoose.js')(log);
var Invoice = require("../models/invoice.js");
var Comment = require("../models/comment.js");

var oracledb = require('oracledb');
//oracledb.maxRows = 103;
//oracledb.outFormat = ;
oracledb.getConnection(
    {
        user          : "afip",
        password      : "afip_",
        connectString : "(DESCRIPTION = " +
                        "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
                        "(CONNECT_DATA = " +
                        "        (SID = AFIP) " +
                        ") " +
                        ")"
    },
    function (err, connection) {
        var invoices,
            counter = 0,
            _autoCommit = true;

        if (err) {
            console.error(err.message);
            return;
        }
        invoices = Invoice.find()
            .sort({_id: 1})
            .skip(0)
            .limit(10000)
//            .populate('comment')
            .lean();
        invoices = invoices.stream();
        invoices.on('data', function (invoice) {
            let strSql, // jshint ignore:line
                param;

            strSql = "insert into INVOICE_HEADER " +
                "(ID, " +
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
                "RESEND," +
                "REGISTRADO_EN" +
                ") VALUES (" +
                "invoices_seq.nextval, " +
                ":terminal, " +
                ":codTipoComprob, " +
                ":nroPtoVenta, " +
                ":nroComprob, " +
                ":codTipoAutoriz, " +
                ":codAutoriz, " +
                ":codTipoDoc," +
                ":nroDoc, " +
                ":clientId, " +
                ":razon, " +
                ":importeGravado, " +
                ":importeNoGravado, " +
                ":importeExento, " +
                ":importeIva, " +
                ":importeSubtotal, " +
                ":importeOtrosTributos, " +
                ":importeTotal, " +
                ":total, " +
                ":codMoneda," +
                ":cotiMoneda," +
                ":observa, " +
                ":codConcepto," +
                "to_date(:fechaEmision, 'YYYY-MM-DD')," +
                "to_date(:fechaVcto, 'YYYY-MM-DD')," +
                "to_date(:fechaDesde, 'YYYY-MM-DD')," +
                "to_date(:fechaHasta, 'YYYY-MM-DD')," +
                "to_date(:fechaVctoPago, 'YYYY-MM-DD'), " +
                ":resend," +
                ":registrado_en " +
                ") RETURNING ID INTO :outputId";
            param = {
                outputId : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
                terminal: invoice.terminal,
                codTipoComprob: invoice.codTipoComprob,
                nroPtoVenta: invoice.nroPtoVenta,
                nroComprob: invoice.nroComprob,
                codTipoAutoriz: invoice.codTipoAutoriz,
                codAutoriz: invoice.codAutoriz,
                codTipoDoc: invoice.codTipoDoc,
                nroDoc: invoice.nroDoc,
                clientId: invoice.clientId,
                razon: invoice.razon,
                importeGravado: invoice.importe.gravado,
                importeNoGravado: invoice.importe.noGravado,
                importeExento: invoice.importe.exento,
                importeIva: invoice.importe.iva,
                importeSubtotal: invoice.importe.subtotal,
                importeOtrosTributos: invoice.importe.otrosTributos,
                importeTotal: invoice.importe.total,
                total: invoice.total,
                codMoneda: invoice.codMoneda,
                cotiMoneda: invoice.cotiMoneda,
                observa: invoice.observa,
                codConcepto: invoice.codConcepto,
                fechaEmision: moment(invoice.fecha.emision).format('YYYY-MM-DD'),
                fechaVcto: moment(invoice.fecha.vcto).format('YYYY-MM-DD'),
                fechaDesde: moment(invoice.fecha.desde).format('YYYY-MM-DD'),
                fechaHasta: moment(invoice.fecha.hasta).format('YYYY-MM-DD'),
                fechaVctoPago: moment(invoice.fecha.vctoPago).format('YYYY-MM-DD'),
                resend: invoice.resend,
                registrado_en: dateTime.getDateTimeFromObjectId(invoice._id)
            };
            connection.execute(strSql, param, {autoCommit: _autoCommit}, function(err, result) {
                if (err) {
                    console.error("ERROR EN HEADER: %j", err);
                    process.exit();
                } else {
                    var tasks = [];
                    invoice.detalle.forEach(function (detalle) {
                        detalle.items.forEach(function (item) {
                            var task = function (callbackDetail) {
                                strSql = "insert into INVOICE_DETAIL " +
                                    "(ID," +
                                    "INVOICE_HEADER_ID," +
                                    "CONTENEDOR," +
                                    "IMO," +
                                    "BUQUE_CODIGO," +
                                    "BUQUE_NOMBRE," +
                                    "BUQUE_VIAJE," +
                                    "BUQUE_FECHA," +
                                    "CODE," +
                                    "CNT," +
                                    "UNI_MED," +
                                    "IMP_UNIT," +
                                    "IMP_TOT" +
                                    ") VALUES (" +
                                    "invoices_seq.nextval," +
                                    ":INVOICE_HEADER_ID, " +
                                    ":CONTENEDOR, " +
                                    ":IMO, " +
                                    ":BUQUE_CODIGO, " +
                                    ":BUQUE_NOMBRE, " +
                                    ":VIAJE, " +
                                    ":FECHA," +
                                    ":CODE, " +
                                    ":IMPUNIT, " +
                                    ":UNIMED," +
                                    ":CNT, " +
                                    ":IMPTOT)";
                                param = {
                                    INVOICE_HEADER_ID :result.outBinds.outputId[0],
                                    CONTENEDOR: detalle.contenedor,
                                    IMO: (detalle.IMO !== undefined) ? detalle.IMO : 0,
                                    BUQUE_CODIGO: detalle.buque.codigo,
                                    BUQUE_NOMBRE: detalle.buque.nombre,
                                    VIAJE: detalle.buque.viaje,
                                    FECHA: detalle.buque.fecha,
                                    CODE: item.id,
                                    IMPUNIT: item.impUnit,
                                    IMPTOT: item.impTot,
                                    UNIMED: item.uniMed,
                                    CNT: item.cnt
                                };
                                connection.execute(strSql, param, {autoCommit: _autoCommit}, function(err, resultDetail) {
                                    if (err) {
                                        console.error("ERROR EN DETAIL: %s", err.message);
                                        callbackDetail();
                                    } else {
                                        callbackDetail();
                                    }
                                });
                            };
                            tasks.push(task);
                        });
                    });

                    /*
                    invoice.comment.forEach(function (comment) {
                        var task = function (callbackDetail) {
                            strSql = "insert into INVOICE_COMMENT " +
                                "(ID," +
                                "INVOICE_HEADER_ID," +
                                "TITLE," +
                                "COMENTARIO," +
                                "USR," +
                                "STATE," +
                                "GRUPO ) VALUES (" +
                                "invoices_seq.nextval, " +
                                ":INVOICE_HEADER_ID," +
                                ":TITLE, " +
                                ":COMENTARIO," +
                                ":USR," +
                                ":STATE," +
                                ":GRUPO )";
                            param = {
                                INVOICE_HEADER_ID :result.outBinds.outputId[0],
                                TITLE: comment.title,
                                COMENTARIO: comment.comment,
                                USR: comment.user,
                                STATE: comment.state,
                                GRUPO: comment.group
                            };
                            connection.execute(strSql, param, {autoCommit: _autoCommit}, function(err, resultComment) {
                                if (err) {
                                    console.error("ERROR EN COMMENT: %s", err.message);
                                    callbackDetail();
                                } else {
                                    callbackDetail();
                                }
                            });
                        };
                        tasks.push(task);
                    });
*/
  /*
                    invoice.estado.forEach(function (estado) {
                        var task = function (callbackDetail) {
                            strSql = "insert into INVOICE_STATE " +
                                "(ID," +
                                "INVOICE_HEADER_ID," +
                                "USR," +
                                "GRUPO," +
                                "STATE ) VALUES (" +
                                "invoices_seq.nextval, " +
                                ":INVOICE_HEADER_ID," +
                                ":USR," +
                                ":GRUPO," +
                                ":STATE )";
                            param = {
                                INVOICE_HEADER_ID :result.outBinds.outputId[0],
                                USR: estado.user,
                                STATE: estado.estado,
                                GRUPO: estado.grupo
                            };
                            connection.execute(strSql, param, {autoCommit: _autoCommit}, function(err, resultComment) {
                                if (err) {
                                    console.error("ERROR EN STATE: %s", err.message);
                                    callbackDetail();
                                } else {
                                    callbackDetail();
                                }
                            });
                        };
                        tasks.push(task);
                    });
*/
                    async.parallel(tasks, function (err, data) {
                        if (counter++ % 1000 === 0) {
                            console.log("Commited %d", counter - 1);
                        }

/*
                        connection.commit(function(err) {
                            if (err)
                                console.error(err.message);
                            else
                            if (counter++ % 1000 === 0) {
                                console.log("Commited %d", counter - 1);
                            }
                        });
*/
                    });
                }
            });
/*
            if (counter++ % 1000 === 0) {
                console.log("Commited %d", counter - 1);

                connection.commit(function(err) {
                    if (err)
                        console.error(err.message);
                    else
                        console.log("Commited %d", counter - 1);
                });
            }
*/
        });
        invoices.on('close', function() {
            console.log("FINISHED INVOICES");
        });

    });

function doRelease(connection) {
    connection.release(
        function(err) {
            if (err) {
                console.error(err.message);
            }
        });
};