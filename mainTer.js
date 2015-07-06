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
    port = process.env.PORT || config.server_port;

//moment.locale('es');
//Conecta a la base de datos MongoDb
require('./include/mongoose.js')(log);
//Crea un servidor http en puerto 8080
var httpExpress = require('./include/httpExpress.js')(log, port, true);

params = {
    server: config.url,
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
