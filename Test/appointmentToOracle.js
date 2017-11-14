/**
 * Created by diego on 1/16/17.
 */

'use strict';

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");
var dateTime = require('../include/moment');

var mongoose = require("mongoose");

require('../include/mongoose.js')(config.mongo.url, config.mongo.options, log);
var Appointment = require("../models/appointment.js");

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
            appointments,
            gap = 1000,
            i;

        if (err) {
            console.error(err.message);
            return;
        }

        for (i = 0; i < 4624; i++) {
            counter.push({skip: i * gap, limit: gap});
        }
        i = 0;
        async.eachSeries(counter, (rango, asyncCallback_round) => {
                //ObjectId("587d219ab8888c2b44010494")
                Appointment.aggregate([
                    {$match: {_id: {$lte: mongoose.Types.ObjectId("587d219ab8888c2b44010494") }}},
                    {$group: {
                        _id: {
                            terminal: '$terminal',
                            contenedor: '$contenedor',
                            buque: '$buque',
                            viaje: '$viaje',
                            inicio: '$inicio',
                            fin: '$fin',
                            mov: '$mov'
                        },
                        alta: {$last: '$alta'},
                        user: {$last: '$user'},
                        disponibles_t1: {$last: '$disponibles_t1'},
                        verifica: {$last: '$verifica'},
                        verifica_turno: {$last: '$verifica_turno'},
                        verifica_tipo: {$last: '$verifica_tipo'},
                        email: {$last: '$email'},
                        emailStatus: {$last: '$emailStatus'},
                        cnt: {$sum : 1}
                    }
                    },
                    //{$match: {cnt: {$gt:1}}},
                    {$skip: rango.skip},
                    {$limit: rango.limit},
                    {$project: {
                        _id: 0,
                        terminal : '$_id.terminal',
                        contenedor : '$_id.contenedor',
                        buque : '$_id.buque',
                        viaje : '$_id.viaje',
                        inicio : '$_id.inicio',
                        fin : '$_id.fin',
                        mov : '$_id.mov',
                        alta: 1,
                        user: 1,
                        disponibles_t1: 1,
                        verifica: 1,
                        verifica_turno: 1,
                        verifica_tipo: 1,
                        email: 1,
                        emailStatus: 1
                    }
                    }//,{$group: {_id: '', total: {$sum: 1}}}
                ])
                    .allowDiskUse(true)
                    .sort({_id: 1})
                    //.skip(rango.skip)
                    //.limit(rango.limit)
                    //.lean()
                    .exec((err, AppointmentsData) => {
                        let strSql,
                            param;

                        if (err) {
                            console.log("ERROR %s", err);
                            doRelease(connection);
                            //process.exit();
                        } else {

                            var tasks = [];
                            AppointmentsData.forEach(item => {
                                var task = (AppoCallback => {
                                    var param = {
                                        "terminal": item.terminal,
                                        "contenedor": item.contenedor,
                                        "inicio" : item.inicio,
                                        "fin" : item.fin,
                                        buque: item.buque,
                                        viaje: item.viaje
                                    };
                                    if (item.alta !== null) {
                                        param.alta = item.alta;
                                    }
                                    if (item.user !== null) {
                                        param.user = item.user;
                                    }
                                    if (item.disponibles_t1 !== null) {
                                        param.disponibles_t1 = item.disponibles_t1;
                                    }
                                    if (item.verifica !== null) {
                                        param.verifica = item.verifica;
                                    }
                                    if (item.verifica_turno !== null) {
                                        param.verifica_turno = item.verifica_turno;
                                    }
                                    if (item.verifica_tipo !== null) {
                                        param.verifica_tipo = item.verifica_tipo;
                                    }
                                    if (item.email !== null) {
                                        param.email = item.email;
                                    }
                                    if (item.emailStatus !== null) {
                                        param.emailStatus = item.emailStatus;
                                    }
                                    if (item.mov !== null) {
                                        param.mov = item.mov;
                                    }

                                    Appo.insert(param, (err, data) => {
                                        AppoCallback();
                                    });
                                });
                                tasks.push(task);
                            });
                            async.parallel(tasks, (err, data) => {
                                console.log(rango);
                                asyncCallback_round();
                            });
    //                        doRelease(connection);
    /*                        async.eachSeries(gatesData, function (gate, asyncCallback) {
                                    i++;

                                    strSql = "insert into GATES " +
                                        "(ID," +
                                        "REGISTRADO_EN) VALUES (" +
                                        "gates_seq.nextval," +
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
                                });*/
                        }

                });
            },
            function () {

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