/**
 * Created by diego on 7/3/15.
 */

"use strict";

var config = require('./config/config.js'),
    log4n = require('./include/log/log4node.js'),
    log = new log4n.log(config.log),
    io = require('socket.io-client'),
    ioClient,
    params,
    moment = require('moment'),
    port = process.env.PORT || config.server_port_ter,
    httpExpress,
    oracle;

//moment.locale('es');
/** Conecta a la base de datos MongoDb */
require('./include/mongoose.js')(config.mongo.url, config.mongo.options, log);

/** Crea un servidor http en puerto 8080 */
httpExpress = require('./include/httpExpress.js')(log, port, true);

/** Se conecta al servidor Socket */
ioClient = io.connect(config.socket_url, { 'forceNew': false});
ioClient.once('connect', function () {
    log.logger.info("Conectado al socket IO %s", config.socket_url);
});
ioClient.on('reconnect', function() {
    log.logger.info("RE Conectado al socket IO %s", config.socket_url);
});
ioClient.once('connect_error', function() {
    log.logger.error("Error Conectando al socket IO %s", config.socket_url);
});

/** Conexion a ORACLE */
oracle = require('./include/oracle.js');
oracle = new oracle();
//oracle.oracledb.maxRows = 5000;
oracle.oracledb.createPool({
    user: "afip",
    password: "afip_",
    connectString: "(DESCRIPTION = " +
                    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
                    "(CONNECT_DATA = " +
                    "        (SID = AFIP) " +
                    ") " +
                    ")",
    poolMax: 500,
    poolMin: 2,
    poolIncrement: 5,
    poolTimeout: 4
}, //TODO check ORA-24418
    (err, pool) => {

        oracle.pool = pool;
        log.logger.info("Oracle Connected to Database. Versión %s", oracle.oracledb.oracleClientVersion);

        if (err) {
            log.logger.error('Oracle: %s', err.message);
        }

        global.cache = {};

        params = {
            server: {ip: config.domain, port: port},
            node: {
                version: process.version,
                runtime: httpExpress.app.get('runtime'),
                timeElapsed: moment(moment(httpExpress.app.get('runtime'))).fromNow(true)
            },
            oracle: {
                pool: pool
            }
        };

        var VoucherType = require('./lib/voucherType.js');
        VoucherType = new VoucherType(oracle);

        VoucherType.getAll({},{format: 'array'})
            .then(data => {
                global.cache.voucherTypes = data.data;
                require('./routes/routesTer')(log, httpExpress.app, ioClient, oracle, params);
            })
            .catch(err => {
                log.logger.error(err);
            });

    });

process.on('exit', () => {
    log.logger.error('exiting');
});

process.on('uncaughtException', function (err) {
    log.logger.info("Caught exception: " + err);
});
