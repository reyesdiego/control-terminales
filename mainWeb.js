/**
 * Created by diego on 7/3/15.
 */
'use strict';

var config = require('./config/config.js'),
    log4n = require('./include/log/log4node.js'),
    log = new log4n.log(config.log),
    params,
    port = process.env.PORT || config.server_port_web,
    passport = null,
    httpExpress,
    oracle,
    VoucherType = require('./models/voucherType.js'),
    voucherType;

global.cache = {
    online: []
};

/** Conecta a la base de datos MongoDb */
require('./include/mongoose.js')(log);
/** Crea un servidor http sobre express en puerto 8090 */
httpExpress = require('./include/httpExpress.js')(log, port, true);

require('./routes/accounts')(log, httpExpress.app, passport);

oracle = require('./include/oracle.js');
oracle = new oracle();
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
},
    function (err, pool) {

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

        voucherType = VoucherType.find({}, {_id: 1, description: 1});
        voucherType.lean();
        voucherType.exec(function (err, data) {
            var result = {};
            data.forEach(function (item) {
                result[item._id] = item.description;
            });
            global.cache.voucherTypes = result;
            require('./routes/routesTer')(log, httpExpress.app, httpExpress.io, oracle, params);
        });

        require('./routes/routesWeb')(log, httpExpress.app, httpExpress.io, oracle, params);
    });

process.on('exit', function () {
    log.logger.error('exiting');
});

process.on('uncaughtException', function (err) {
    log.logger.error("Caught exception: %s", err.stack);
});
