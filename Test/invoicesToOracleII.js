/**
 * Created by diego on 1/27/16.
 */

'use strict';

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");
var dateTime = require('../include/moment');

require('../include/mongoose.js')(config.mongo.url, config.mongo.options, log);
var Invoice = require("../models/invoice.js");
var Comment = require("../models/comment.js");

var oracle = require('../include/oracledbWrap');
oracle.createPool({
        user          : "afip",
        password      : "afip_",
        connectString : "(DESCRIPTION = " +
        "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
        "(CONNECT_DATA = " +
        "        (SID = AFIP) " +
        ") " +
        ")"
    }).then(function (pool) {

        oracle.getConnection()
        .then((connection) => {
                var invoices,
                    _autoCommit = true,
                    counter = [],
                    gap = 1000,
                    i;

                for (i = 0; i < 4; i++) {
                    counter.push({skip: i * gap, limit: gap});
                }
                i = 0;

                async.eachSeries(counter, function (rango, asyncCallback_round) {

                        invoices = Invoice.find({
                            'fecha.emision': { $gte: moment("2016-08-01").toDate(), $lt: moment("2016-09-01").toDate()}
                        })
                            .sort({_id: 1})
                            .skip(rango.skip)
                            .limit(rango.limit)
                            .populate('comment')
                            .lean();
                        invoices.exec(function (err, invoices) {

                            async.eachSeries(invoices, function (invoice, asyncCallback_header) {
                                var strSql,
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
                                    outputId : {type: oracle.oracledb.NUMBER, dir: oracle.oracledb.BIND_OUT},
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
                                oracle.execute(strSql, param, {autoCommit: _autoCommit}, connection)
                                    .then(function(result) {
                                        i++;
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
                                                        ":CNT, " +
                                                        ":UNIMED," +
                                                        ":IMPUNIT, " +
                                                        ":IMPTOT)";
                                                    param = {
                                                        INVOICE_HEADER_ID: result.outBinds.outputId[0],
                                                        CONTENEDOR: detalle.contenedor,
                                                        IMO: (detalle.IMO !== undefined) ? detalle.IMO : 0,
                                                        BUQUE_CODIGO: detalle.buque.codigo,
                                                        BUQUE_NOMBRE: detalle.buque.nombre,
                                                        VIAJE: detalle.buque.viaje,
                                                        FECHA: detalle.buque.fecha,
                                                        CODE: item.id,
                                                        CNT: item.cnt,
                                                        UNIMED: item.uniMed,
                                                        IMPUNIT: item.impUnit,
                                                        IMPTOT: item.impTot
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

                                        invoice.estado.forEach(function (estado) {
                                            var task = function (callbackState) {
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
                                                        callbackState();
                                                    } else {
                                                        callbackState();
                                                    }
                                                });
                                            };
                                            tasks.push(task);
                                        });

                                        invoice.comment.forEach(function (comment) {
                                            var task = function (callbackDetail) {
                                                strSql = "insert into INVOICE_COMMENT " +
                                                    "(ID," +
                                                    "INVOICE_HEADER_ID," +
                                                    "TITLE," +
                                                    "COMENTARIO," +
                                                    "USR," +
                                                    "STATE," +
                                                    "GRUPO," +
                                                    "REGISTRADO_EN ) VALUES (" +
                                                    "invoices_seq.nextval, " +
                                                    ":INVOICE_HEADER_ID," +
                                                    ":TITLE, " +
                                                    ":COMENTARIO," +
                                                    ":USR," +
                                                    ":STATE," +
                                                    ":GRUPO," +
                                                    ":REGISTRADO_EN )";
                                                param = {
                                                    INVOICE_HEADER_ID :result.outBinds.outputId[0],
                                                    TITLE: comment.title,
                                                    COMENTARIO: comment.comment,
                                                    USR: comment.user,
                                                    STATE: comment.state,
                                                    GRUPO: comment.group,
                                                    REGISTRADO_EN: dateTime.getDateTimeFromObjectId(comment._id)
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

                                        async.parallel(tasks, function (err, data) {
                                            asyncCallback_header();
                                        });

                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                        asyncCallback_header();
                                    });
                            }, function (err, data){
                                console.log("TERMINO %j, %d", rango, invoices.length);
                                asyncCallback_round();
                            });

                        });

                    },
                    function () {
                        console.log("TERMINO %d", i);
                        oracle.releaseConnection(connection);
                        process.exit(0);
                    });
            });

    });

