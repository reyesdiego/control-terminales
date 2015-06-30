// Express configuracion BEGIN
var express = require('express'),
    app = express();

//var favicon = require('serve-favicon');
var logger = require('morgan'),
    methodOverride = require('method-override'),
//var session = require('express-session');
    bodyParser = require('body-parser'),
    multer = require('multer'),
    errorHandler = require('errorhandler');
// Express configuracion END

var http = require('http');

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

var io = require('socket.io')(server);
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
server.on('error', function (err) {
    'use strict';
    if (err.code === 'EADDRINUSE') {
        log.logger.warn('El puerto %s está siendo utilizado por otro proceso. El proceso que intenta iniciar se abortará', app.get('port'));
        process.exit();
    }
});

require('./routes/accounts')(app, null, log);

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
        require('./routes/oracle/routes')(app, log, io, pool);
        require('./routes/routesLoader')(app, log, io, mongoose, pool);
    }
);


// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    'use strict';
    mongoose.connection.close(function () {
        log.logger.info("Mongoose default connection disconnected through app termination");
        log.logger.info("process.env.NODE_ENV %s", process.env.NODE_ENV);
        if (process.env.NODE_ENV === 'production') {
            var mailer = new mail.mail(config.email);
            mailer.send('dreyes@puertobuenosaires.gob.ar', 'AGP-TERAPI - ERROR', 'Mongoose default connection disconnected', function () {
                process.exit();
            });
        } else {
            process.exit();
        }
    });
});
process.on('exit', function () {
    var mailer = new mail.mail(config.email);
    mailer.send('dreyes@puertobuenosaires.gob.ar', 'AGP-TERAPI - ERROR', 'Mongoose default connection disconnected', function () {
        console.log('exit');
    });
});

process.on('uncaughtException', function (err) {
    'use strict';
    log.logger.info("Caught exception: " + err);
});

//for jade views
app.locals.moment = require('moment');


/*app.get('/mail/:user', function (req, res) {
    'use strict';
    var mail = require("./include/emailjs");

    var options = {
        user:    req.params.user,
        password: "desarrollo",
        host:    "10.10.0.170",
        port: "25",
        domain: "puertobuenosaires.gob.ar",
        ssl:     false,
        status: true,
        throughBcc: false
    }

    var mailer = new mail.mail(options);
    var html = {
        data : "<html><body><p>Ud. a solicitado un usario para ingresar a la página de Control de Información de Terminales portuarias. Para activar el mismo deberá hacer click al siguiente link http://terminales.puertobuenosaires.gob.ar:8080/unitTypes?key=TEST</p></body></html>",
        alternative: true
    };

    mailer.send('reyesdiego@hotmail.com', 'Hola', 'Primero', function (err, messageBack) {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        } else {
            console.log(messageBack);
            res.status(200).send(messageBack);
        }
    });

});*/
