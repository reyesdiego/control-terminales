/**
 * Created by diego on 7/3/15.
 */

"use strict";

//module.exports = function () {

var config = require('./config/config.js'),
    log4n = require('./include/log/log4node.js'),
    log = new log4n.log(config.log),
    params,
    moment = require('moment'),
    port = process.env.PORT || config.server_port_ter,
    httpExpress,
    VoucherType = require('./models/voucherType.js'),
    voucherType,
    oracle;

//moment.locale('es');
//Conecta a la base de datos MongoDb
require('./include/mongoose.js')(log);
//Crea un servidor http en puerto 8080
httpExpress = require('./include/httpExpress.js')(log, port, true);



oracle = require('./include/oracle.js');
oracle = new oracle();
oracle.oracledb.maxRows = 5000;
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

        global.cache = {};

        params = {
            server: {ip: config.domain, port: port},
            node: {
                version: process.version,
                runtime: httpExpress.app.get('runtime'),
                timeElapsed: moment(moment(httpExpress.app.get('runtime'))).fromNow(true)
            },
            oracle: {pool: pool}
        }

        voucherType = VoucherType.find({type: -1}, {_id: 1});
        voucherType.lean();
        voucherType.exec(function (err, data) {
            var result = [];
            data.forEach(function (item) {
                result.push(item._id);
            });
            global.cache.voucherTypes = result;
            require('./routes/routesTer')(log, httpExpress.app, httpExpress.io, oracle, params);
        });

    });

process.on('exit', function () {
    log.logger.error('exiting');
});

process.on('uncaughtException', function (err) {
    log.logger.info("Caught exception: " + err);
});

//};
