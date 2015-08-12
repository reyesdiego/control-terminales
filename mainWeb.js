/**
 * Created by diego on 7/3/15.
 */

module.exports = function (log) {

    var config = require('./config/config.js'),
        params,
        moment = require('moment'),
        port = process.env.PORT || config.server_port_web;


//Conecta a la base de datos MongoDb
    require('./include/mongoose.js')(log);
//Crea un servidor http sobre express en puerto 8090
    var httpExpress = require('./include/httpExpress.js')(log, port, true);

    var passport = null;
    require('./routes/accounts')(log, httpExpress.app, passport);

//var oracledb = require('oracledb');
    var oracle = require('./include/oracle.js');
    oracle = new oracle();
    oracle.oracledb.createPool(
        //{
        //    user          : "HR",
        //    password      : "oracle_4U",
        //    connectString : "(DESCRIPTION = " +
        //        "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.226)(PORT = 1521)) " +
        //        "(CONNECT_DATA = " +
        //        "        (SID = ORCL) " +
        //        ") " +
        //        ")",
        //    poolMax       : 50,
        //    poolMin       : 2,
        //    poolIncrement : 5,
        //    poolTimeout   : 4,
        //},
        {
            user: "afip",
            password: "afip_",
            connectString: "(DESCRIPTION = " +
            "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
            "(CONNECT_DATA = " +
            "        (SID = AFIP) " +
            ") " +
            ")",
            poolMax: 50,
            poolMin: 2,
            poolIncrement: 5,
            poolTimeout: 4,
        },
        function (err, pool) {
            'use strict';

            oracle.pool = pool;
            if (err) {
                log.logger.error('Oracle: %s', err.message);
            } else {
                require('./routes/oracle/routes')(log, httpExpress.app, oracle);
            }

            params = {
                server: {ip: config.domain, port: config.server_port_web},
                node: {version: process.version, runtime: httpExpress.app.get('runtime')},
                oracle: {pool: pool}
            };
            require('./routes/routesWeb')(log, httpExpress.app, httpExpress.io, oracle, params);
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

};