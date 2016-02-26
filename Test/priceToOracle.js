/**
 * Created by diego on 2/16/16.
 */

'use strict';

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");

require('../include/mongoose.js')(log);
var Price = require("../models/price.js");
var MatchPrice = require("../models/matchPrice.js");

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
        var prices = Price.find();
        prices.populate('matches');
        prices.lean();
        prices.exec( function (err, data) {
            let strSql, //jshint ignore:line
                param;
            console.log("Se transparan %s registro a Oracle", data.length);

            async.each(data, function (price, callback) {

                strSql = "insert into TARIFARIO " +
                    "(ID, " +
                    "TERMINAL, " +
                    "CODE, " +
                    "DESCRIPCION, " +
                    "UNIDAD, " +
                    "RATE" +
                    ") VALUES (" +
                    "invoices_seq.nextval, " +
                    ":terminal, " +
                    ":code, " +
                    ":description, " +
                    ":unidad," +
                    ":rate " +
                    ") RETURNING ID INTO :outputId";
                param = {
                    outputId : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
                    terminal: price.terminal,
                    code: price.code,
                    description: price.description,
                    unidad: price.unit,
                    rate: price.rate
                };
                connection.execute(strSql, param, {autoCommit:true}, function(err, result) {
                    if (err) {
                        console.error(err.message);
                        process.exit();
                    } else {
                        var tasks = [],
                            task;
                        if (price.matches) {
                            price.matches.forEach(function (match) {
                                match.match.forEach(function (item) {
                                    let param;
                                    task = function (callbackMatch) {
                                        strSql = "insert into TARIFARIO_TERMINAL " +
                                            "(ID," +
                                            "TARIFARIO_ID," +
                                            "TERMINAL," +
                                            "CODE " +
                                            ") VALUES (" +
                                            "invoices_seq.nextval," +
                                            ":tarifario_id, " +
                                            ":terminal, " +
                                            ":code)";
                                        param = {
                                            tarifario_id :result.outBinds.outputId[0],
                                            terminal: match.terminal,
                                            code: item
                                        };
                                        connection.execute(strSql, param, {autoCommit:true}, function(err, resultDetail) {
                                            if (err) {
                                                console.error(err.message);
                                                callbackMatch();
                                            } else {
                                                callbackMatch();
                                            }
                                        });
                                    };
                                    tasks.push(task);
                                });
                            });
                            price.topPrices.forEach(function (topPrice) {
                                task = function (callbackTopPrice) {
                                    let param;
                                    strSql = "insert into TARIFARIO_PRECIO " +
                                            "(ID," +
                                            "TARIFARIO_ID," +
                                            "FECHA," +
                                            "PRECIO," +
                                            "MONEDA " +
                                            ") VALUES (" +
                                            "invoices_seq.nextval," +
                                            ":tarifario_id, " +
                                            "to_date(:fecha, 'YYYY-MM-DD'), " +
                                            ":precio, " +
                                            ":moneda)";
                                        param = {
                                            tarifario_id :result.outBinds.outputId[0],
                                            fecha: moment(topPrice.from).format('YYYY-MM-DD'),
                                            precio: (topPrice.price !== undefined && topPrice.price !== null) ? topPrice.price : 0,
                                            moneda: (topPrice.currency !== undefined) ? topPrice.currency : null
                                        };

                                        connection.execute(strSql, param, {autoCommit:true}, function(err, resultDetail) {
                                            if (err) {
                                                console.error(err.message);
                                                callbackTopPrice();
                                            } else {
                                                callbackTopPrice();
                                            }
                                        });
                                };
                                tasks.push(task);
                            });

                            async.parallel(tasks, function (err, data) {
                                callback();
                            });
                        } else {
                            callback();
                        }
                    }
                });
            }, function () {
                console.log("TERMINO");
                doRelease(connection);
                process.exit();
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