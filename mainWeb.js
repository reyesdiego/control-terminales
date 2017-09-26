/**
 * Created by diego on 7/3/15.
 */
'use strict';

var config = require('./config/config.js'),
    log4n = require('./include/log/log4node.js'),
    log = new log4n.log(config.log),
    socket = require('./include/socketio.js'),
    params,
    port = process.env.PORT || config.server_port_web,
    passport = null,
    httpExpress,
    oracle,
    io;

global.cache = {
    online: []
};

/** Conecta a la base de datos MongoDb */
require('./include/mongoose.js')(config.mongo.url, config.mongo.options, log);
/** Crea un servidor http sobre express en puerto 8090 */
httpExpress = require('./include/httpExpress.js')(log, port, true);
/** Crea el Servidor Socket sobre el servidor http*/
io = socket(httpExpress.server, log);

require('./routes/accounts')(log, httpExpress.app, passport);

oracle = require('./include/oracle.js');
oracle = new oracle();
oracle.oracledb.createPool({
    user: "afip",
    password: "AFIP_",
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
},
    (err, pool) => {

        oracle.pool = pool;

        if (err) {
            log.logger.error('Oracle: %s', err.message);
        } else {
            log.logger.info("Oracle Connected to Database. Versión %s", oracle.oracledb.oracleClientVersion);
        }
        require('./routes/oracle/routes')(log, httpExpress.app, oracle);

        params = {
            server: {ip: config.domain, port: config.server_port_web},
            node: {version: process.version, runtime: httpExpress.app.get('runtime')},
            oracle: {pool: pool}
        };

        var VoucherType = require('./lib/voucherType.js');
        VoucherType = new VoucherType(oracle);

        VoucherType.getAll({}, {format: 'array'})
            .then(data => {
                global.cache.voucherTypes = data.data;
                require('./routes/routesTer')(log, httpExpress.app, io, oracle, params);
            })
            .catch(err => {
                log.logger.error(err);
            });

        require('./routes/routesWeb')(log, httpExpress.app, io, oracle, params);
    });

process.on('exit', function () {
    log.logger.error('exiting');
});

process.on('uncaughtException', function (err) {
    log.logger.error("Caught exception: %s", err.stack);
});

/**
 * Para tester el funcionamiento de PM2
 *
httpExpress.app.get("/killme", function (req,res) {
    httpExpress.server.close();
})
*/