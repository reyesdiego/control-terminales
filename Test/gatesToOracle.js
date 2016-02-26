/**
 * Created by diego on 1/22/16.
 */

'use strict';

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");

require('../include/mongoose.js')(log);
var Gates = require("../models/gate.js");
var Invoices = require("../models/invoice.js");

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
        var gates,
            counter=0;
        if (err) {
            console.error(err.message);
            return;
        }
        console.log("pid %s", process.pid);

        gates = Gates.find({}, {
            _id: false,
            __v: false
        }, {timeOut: false})
            .sort({_id: 1})
            .skip(750000)
            .limit(100000)
            .stream();

        gates.on('data', function (gate) {
            let strSql,
                param;

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
                ":tren) RETURNING ID INTO :outputID";
            param = {
                outputID : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
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
            connection.execute(strSql, param, {autoCommit:true}, function(err, result) {
                if (err) {
                    console.error("%s, ERROR %s, %j", process.pid, err.message, gate);
                } else {
                    if ((counter++ % 1000) === 0)
                        console.log("Process %d", counter-1);
                    ;
                }
            });
        });

        gates.on('close', function (data) {
            console.log("TERMINO");
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
