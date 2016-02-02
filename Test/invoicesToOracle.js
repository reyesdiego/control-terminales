/**
 * Created by diego on 1/27/16.
 */

'use strict';

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");

require('../include/mongoose.js')(log);
var Invoice = require("../models/invoice.js");

var oracledb = require('oracledb');
oracledb.maxRows = 103;
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
    function(err, connection)
    {
        if (err) {
            console.error(err.message);
            return;
        }
        var invoices = Invoice.find();
        invoices.skip(501000);
        invoices.limit(50000);
        invoices.lean();
        invoices.exec( function (err, data) {
            let strSql,
                param;
            console.log("Se transparan %s registro a Oracle", data.length);

            async.each(data, function (invoice, callback){

                strSql = "insert into INVOICE_HEADER " +
                    "(ID," +
                    "NROCOMPROB," +
                    "CODTIPOCOMPROB," +
                    "FECHAEMISION" +
                    ") VALUES (" +
                    "invoices_seq.nextval," +
                    " :nroComprob, :codTipoComprob, to_date(:fecha, 'YYYY-MM-DD')) RETURNING ID INTO :outputId";
                param = {
                    outputId : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
                    nroComprob: invoice.nroComprob,
                    fecha: moment(invoice.fecha.emision).format("YYYY-MM-DD"),
                    codTipoComprob: invoice.codTipoComprob
                };
                connection.execute(strSql, param, {autoCommit:true}, function(err, result) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        async.each(invoice.detalle, function (detalle, callbackDetail) {
                            strSql = "insert into INVOICE_DETAIL " +
                                "(ID," +
                                "INVOICE_HEADER_ID," +
                                "CONTENEDOR," +
                                "BUQUE," +
                                "VIAJE," +
                                "IMPUNIT," +
                                "CNT," +
                                "IMPTOT" +
                                ") VALUES (" +
                                "invoices_seq.nextval," +
                                " :INVOICE_HEADER_ID, :CONTENEDOR, :BUQUE, :VIAJE, :IMPUNIT, :CNT, :IMPTOT)";
                            param = {
                                INVOICE_HEADER_ID :result.outBinds.outputId[0],
                                CONTENEDOR: detalle.contenedor,
                                BUQUE: detalle.buque.nombre,
                                VIAJE: detalle.buque.viaje,
                                IMPUNIT: 1,
                                CNT: 1,
                                IMPTOT: 1
                            };
                            connection.execute(strSql, param, {autoCommit:true}, function(err, resultDetail) {
                                if (err) {
                                    console.error(err.message);
                                }
                                callbackDetail();
                            });
                        }, function () {
                            callback();
                        });
                    }
                });
            }, function () {
                console.log("TERMINO");
                doRelease(connection);
            });
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