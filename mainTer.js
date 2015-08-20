/**
 * Created by diego on 7/3/15.
 */

module.exports = function (log) {

    var config = require('./config/config.js'),
        params,
        moment = require('moment'),
        port = process.env.PORT || config.server_port_ter,
        httpExpress;

//moment.locale('es');
//Conecta a la base de datos MongoDb
    require('./include/mongoose.js')(log);
//Crea un servidor http en puerto 8080
    httpExpress = require('./include/httpExpress.js')(log, port, true);

    params = {
        server: {ip: config.domain, port: config.server_port_ter},
        node: {version: process.version, runtime: httpExpress.app.get('runtime'), timeElapsed: moment(moment(httpExpress.app.get('runtime'))).fromNow(true)}
    };

    require('./routes/routesTer')(log, httpExpress.app, httpExpress.io, params);

    process.on('exit', function () {
        'use strict';
        log.logger.error('exiting');
    });

    process.on('uncaughtException', function (err) {
        'use strict';
        log.logger.info("Caught exception: " + err);
    });

};
