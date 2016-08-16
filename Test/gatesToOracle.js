/**
 * Created by diego on 1/22/16.
 */

'use strict';

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");
var dateTime = require('../include/moment');

require('../include/mongoose.js')(config.mongo.url, config.mongo.options, log);
var Gates = require("../models/gate.js");
var Invoices = require("../models/invoice.js");

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
    function(err, connection) {

        var counter = [],
            gates,
            gap = 1000,
            i;

        if (err) {
            console.error(err.message);
            return;
        }

        for (i = 0; i < 2; i++) {
            counter.push({skip: i * gap, limit: gap});
        }
        i = 0;
        async.eachSeries(counter, function (rango, asyncCallback_round) {

                gates = Gates.find({
                    gateTimestamp: { $gte: moment("2016-08-01").toDate(), $lt: moment("2016-08-02").toDate()}
                })
                    .sort({_id: 1})
                    .skip(rango.skip)
                    .limit(rango.limit)
                    .lean();
                gates.exec(function (err, gatesData) {
                    let strSql,
                        param;

                    if (err) {
                        console.log(err);
                        doRelease(connection);
                        process.exit();
                    } else {
//                        doRelease(connection);
                        async.eachSeries(gatesData, function (gate, asyncCallback) {
                                i++;

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
                                    "TREN," +
                                    "REGISTRADO_EN) VALUES (" +
                                    "gates_seq.nextval," +
                                    ":terminal, " +
                                    ":buque, " +
                                    ":viaje, " +
                                    ":contenedor, " +
                                    ":carga, " +
                                    ":mov, " +
                                    ":tipo, " +
                                    "to_date(:gateTimestamp, 'YYYY-MM-DD HH24:MI:SS'), " +
                                    "to_date(:turnoInicio, 'YYYY-MM-DD HH24:MI:SS'), " +
                                    "to_date(:turnoFin, 'YYYY-MM-DD HH24:MI:SS'), " +
                                    ":patenteCamion, " +
                                    ":tren," +
                                    ":registrado_en) RETURNING ID INTO :outputID";
                                param = {
                                    outputID : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
                                    terminal: gate.terminal,
                                    buque: gate.buque,
                                    viaje: gate.viaje,
                                    contenedor: gate.contenedor,
                                    carga: gate.carga,
                                    mov: gate.mov,
                                    tipo: gate.tipo,
                                    gateTimestamp: moment(gate.gateTimestamp).format("YYYY-MM-DD HH:mm:ss"),
                                    turnoInicio: (gate.turnoInicio === null ) ? null : moment(gate.turnoInicio).format("YYYY-MM-DD HH:mm:ss"),
                                    turnoFin: (gate.turnoFin === null ) ? null : moment(gate.turnoFin).format("YYYY-MM-DD HH:mm:ss"),
                                    patenteCamion: gate.patenteCamion,
                                    tren: gate.tren,
                                    registrado_en: dateTime.getDateTimeFromObjectId(gate._id)
                                };
                                connection.execute(strSql, param, {autoCommit:true}, function(err, result) {
                                    if (err) {
                                        console.error("%s, ERROR %s, %j", process.pid, err.message, gate);
                                        asyncCallback();
                                    } else {
                                        asyncCallback();
                                    }
                                });
                            },
                            function () {
                                console.log("TERMINO %j, %d", rango, gatesData.length);
//                                doRelease(connection);
                                asyncCallback_round();
                            });
                    }

                });
            },
            function () {
                console.log("TERMINO %d", i);
                doRelease(connection);
                process.exit(0);
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