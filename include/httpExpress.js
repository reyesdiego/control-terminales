/**
 * Created by diego on 7/3/15.
 */

module.exports = function (log, port, withSocketIo) {
    'use strict';

// Express configuracion BEGIN
    var express = require('express'),
        app = express(),
        compress = require('compression'),
        server,
        io,
        result,
        path = require('path'),
        moment = require('moment').locale('es');

//var favicon = require('serve-favicon');
    var logger = require('morgan'),
        methodOverride = require('method-override'),
        //session = require('express-session');
        bodyParser = require('body-parser'),
        multer = require('multer'),
        errorHandler = require('errorhandler');
// Express configuracion END

    var http = require('http');

    app.set('port', port);
    app.set('runtime', new Date());
    app.set('views', path.join(__dirname, '..', '/public'));
    app.set('view engine', 'jade');
    /** For Jade Views*/
    app.locals.moment = require('moment');

    app.use(compress({
        level : 8
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    //app.use(multer());
    app.use(methodOverride());
    app.use(express.static(path.join(__dirname, '..', '/public')));

    app.all('/*', function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", 'X-Requested-With, Content-Type, token');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        //res.header('Access-Control-Request-Method', 'GET');
        res.header('Access-Control-Request-Headers', 'Content-Type, token');
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        if ('OPTIONS' === req.method) {
            res.status(200).send();
        } else {
            next();
        }
    });

    http.globalAgent.maxSockets = 100;
    server = http.createServer(app);
    server.listen(port, function () {
        log.logger.info("#%s Nodejs %s Running on %s://localhost:%s", process.pid, process.version, 'http', port);
    });
    server.on('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            log.logger.warn('El puerto %s está siendo utilizado por otro proceso. El proceso que intenta iniciar se abortará', app.get('port'));
            process.exit();
        }
    });

    result = {
        app: app,
        server: server
    };

    return result;
}