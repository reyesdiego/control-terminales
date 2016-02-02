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
        var gates = Gates.find();
        gates.skip(453527);
        gates.limit(73);
//        gates.sort({_id: 1});
        gates.lean();
        gates.exec( function (err, data) {
            let strSql,
                values = [];
            console.log("Se transparan %s registro a Oracle", data.length);

            async.each(data, function (gate, callback){

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
                    "PATENTECAMION) VALUES (" +
                    "gates_seq.nextval," +
                    " :1, :2, :3, :4, :5, :6, :7, to_date(:8, 'YYYY-MM-DD HH24:MI:SS'), to_date(:9, 'YYYY-MM-DD HH24:MI:SS'), to_date(:10, 'YYYY-MM-DD HH24:MI:SS'), :11)";
                values = [gate.terminal,
                    gate.buque,
                    gate.viaje,
                    gate.contenedor,
                    gate.carga,
                    gate.mov,
                    gate.tipo,
                    moment(gate.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"),
                    (gate.turnoInicio === null ) ? null : moment(gate.turnoInicio).format("YYYY-MM-DD hh:mm:ss"),
                    (gate.turnoFin === null ) ? null : moment(gate.turnoFin).format("YYYY-MM-DD hh:mm:ss"),
                    gate.patenteCamion];
                connection.execute(strSql, values, {autoCommit:true}, function(err, result) {
                    if (err) {
                        console.error(err.message);
                    }
                    callback();
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