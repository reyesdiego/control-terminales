// Express configuracion BEGIN
var express = require('express');
var app = express();

//var favicon = require('serve-favicon');
var logger = require('morgan'),
    methodOverride = require('method-override'),
//var session = require('express-session');
    bodyParser = require('body-parser'),
    multer = require('multer'),
    errorHandler = require('errorhandler');
// Express configuracion END

var http = require('http'),
    socketio = require('socket.io');

var mail = require("./include/emailjs"),
    path = require('path');

http.globalAgent.maxSockets = 100;
var server = http.createServer(app);

var config = require('./config/config.js'),
    log4n = require('./include/log/log4node.js'),
    logOptions = {
        path: config.log.path,
        filename: config.log.filename,
        toConsole: config.log.toConsole,
        toFile: config.log.toFile
    },
    log = new log4n(logOptions);

var io = socketio.listen(server);
io.set('log level', 1);
io.on('connection', function (socket) {
    'use strict';
    log.logger.info('Socket Client Connected: %s.', socket.id);

    socket.on('newUser', function (cb) {
        return cb(socket.id);
    });

});

var mongoose = require('mongoose');
//Database configuration
mongoose.connect(config.mongo_url, config.mongo_opts);

mongoose.connection.on('connected', function () {
    'use strict';
    log.logger.info("Mongoose version: %s", mongoose.version);
    log.logger.info("Connected to Database. %s", config.mongo_url);
});
mongoose.connection.on('error', function (err) {
    'use strict';
    log.logger.error("Database or Mongoose error. %s", err.toString());
});
mongoose.connection.on('disconnected', function () {
    'use strict';
    log.logger.error("Mongoose default connection disconnected");
});

var genericPool = require('generic-pool');
var oracle = require('oracle');

var pool = genericPool.Pool({
        name: 'testpool',
        log: false,
        max: 15,
        create: function (callback) {
            'use strict';
            var settings = {
                    hostname: config.oracle.hostname,
                    port: config.oracle.port,
                    database: config.oracle.database,
                    user: config.oracle.user,
                    password: config.oracle.password
                };
            new oracle.connect(settings, function (err, connection) {
                callback(err, connection);
            });
        },
        destroy: function (connection) {
            'use strict';
            connection.close();
        }
    });

app.set('runtime', new Date());
app.set('port', process.env.PORT || config.server_port);
app.set('views', __dirname + '/public');
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// error handling middleware should be loaded after the loading the routes
if ('development' === app.get('env')) {
    app.use(errorHandler());
}

app.all('/*', function (req, res, next) {
    'use strict';
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
    //next();
});

server.listen(app.get('port'), function () {
    'use strict';
    log.logger.info("Nodejs server Version: %s", process.version);
    log.logger.info("Running on %s://localhost:%s", 'http', app.get('port'));
    log.logger.info("Process Id (pid): %s", process.pid);
});

require('./routes/accounts')(app, null, log);
require('./routes/routesLoader')(app, log, io, mongoose, pool);


// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    'use strict';
    mongoose.connection.close(function () {
        log.logger.info("Mongoose default connection disconnected through app termination");
        log.logger.info("process.env.NODE_ENV %s", process.env.NODE_ENV);
        if (process.env.NODE_ENV === 'production') {
            var mailer = new mail.mail(config.email);
            mailer.send('noreply@puertobuenosaires.gob.ar', 'AGP-TERAPI - ERROR', 'Mongoose default connection disconnected', function () {
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
});

process.on('uncaughtException', function (err) {
    'use strict';
    log.logger.info("Caught exception: " + err);
});


app.get('/kk', function (req, res) {
    'use strict';

    var moment = require("moment");
    var param = {"buque": "SE LA BANCO",
        "viaje": "x1",
        "contenedor": "CAXU1234567",
        "fecha": moment("2015-05-20T20:00:00.000Z").format("DD-MM-YYYY"),
        "horario": moment("2015-05-20T20:00:00.000Z").format("HH:mm") + " hs. a " + moment("2015-05-20T20:00:00.000Z").format("HH:mm") + " hs.",
        "tipo": "EXPO",
        "email": "reyesdiego@hotmail.com",
        "full_name": "B.A.C.T.S.S.A. (Terminal 5)",
        "alta": moment("2015-05-20T20:00:00.000Z").format("DD-MM-YYYY HH:mm") + " hs.",
        "disponibles_t1": 14,
        "verifica": "",//moment("2015-05-20T20:00:00.000Z").format("DD-MM-YYYY"),
        "verifica_turno": "MA",
        "verifica_tipo": "PISO"
        };
    res.render('comprobanteTurno', param);

});
