/**
 * Created by diego on 7/3/15.
 */

var config = require('./config/config.js'),
    log4n = require('./include/log/log4node.js'),
    logOptions = {
        path: config.log.path,
        filename: config.log.filename,
        toConsole: config.log.toConsole,
        toFile: config.log.toFile
    },
    log = new log4n(logOptions),
    params,
    moment = require('moment'),
    port = process.env.PORT || config.server_port_web;


//Conecta a la base de datos MongoDb
require('./include/mongoose.js')(log);
//Crea un servidor http sobre express en puerto 8090
var httpExpress = require('./include/httpExpress.js')(log, port, true);

var passport = null;
require('./routes/accounts')(log, httpExpress.app, passport);

var oracledb = require('oracledb');
oracledb.createPool(
    {
        user          : "HR",
        password      : "oracle_4U",
        connectString : "(DESCRIPTION = " +
            "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.226)(PORT = 1521)) " +
            "(CONNECT_DATA = " +
            "        (SID = ORCL) " +
            ") " +
            ")",
        poolMax       : 50,
        poolMin       : 2,
        poolIncrement : 5,
        poolTimeout   : 4
    },
    function (err, pool) {
        'use strict';

        if (err) {
            log.logger.error('Oracle error: %s', err);
        } else {
            require('./routes/oracle/routes')(log, httpExpress.app, pool);

            params = {
                server: config.url,
                node: {version: process.version, runtime: httpExpress.app.get('runtime'), timeElapsed: moment(moment(httpExpress.app.get('runtime'))).fromNow(true)},
                oracle: {pool: pool}
            };

            require('./routes/routesWeb')(log, httpExpress.app, httpExpress.io, pool, params);
        }
    }
);

process.on('exit', function () {
    'use strict';
    log.logger.error('exiting');
});

process.on('uncaughtException', function (err) {
    'use strict';
    log.logger.info("Caught exception: " + err);
});
