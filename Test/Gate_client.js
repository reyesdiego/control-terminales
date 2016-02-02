/**
 * Created by diego on 1/18/16.
 */

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log);

//Conecta a la base de datos MongoDb
require('../include/mongoose.js')(log);


var oracledb = require('oracledb');
oracledb.maxRows = 103;
oracledb.outFormat = oracledb.OBJECT; //oracledb.outFormat = ;
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
        var newGate;
        if (err) {
            console.error(err.message);
            return;
        } else {

            var Gate = require('../lib/gate.js');

            newGate = {
                terminal: "BACTSSA",
                "buque": "x",
                "viaje": "",
                "contenedor": "CAXU1234567",
                "mov": "IMPO",
                "tipo": "OUT",
                "carga": "LL",
                "patenteCamion": "WWW333",
                "gateTimestamp": "2014-03-17T07:00:00.000Z",
                "turnoInicio": "2014-03-17T07:00:00.000Z",
                "turnoFin": "2014-03-17T09:00:00.000Z"
            };

            var o = new Gate(connection);
            o.add(newGate, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //log.logger.insert('Gate INS: %s - %s - %s', gateNew._id, usr.terminal, moment(gateNew.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"));
                    console.log(result);
                    //io.sockets.emit('gate', socketMsg);
                }
            });

            var mo = new Gate();
            mo.add(newGate, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //log.logger.insert('Gate INS: %s - %s - %s', gateNew._id, usr.terminal, moment(gateNew.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"));
                    console.log(result);
                    //io.sockets.emit('gate', socketMsg);
                }
            });

        }
});


//process.exit();