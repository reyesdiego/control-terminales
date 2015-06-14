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

var http = require('http'),
	path = require('path');

var config = require('../config/config.js'),
	log4n = require('../include/log/log4node.js'),
	logOptions = {
		path: config.log.path,
		filename: config.log.filename,
		toConsole: config.log.toConsole,
		toFile: config.log.toFile
	},
	log = new log4n(logOptions);


http.globalAgent.maxSockets = 100;
var server = http.createServer(app);

app.set('runtime', new Date());
app.set('port', process.env.PORT || 8080);
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


// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
	'use strict';
});

process.on('uncaughtException', function (err) {
	'use strict';
	log.logger.info("Caught exception: " + err);
});


app.locals.moment = require('moment');

app.get('/', function (req,res){
	res.status(200).send("HI:"+process.version+'\r\n');
})
app.get('/accounts', function (req,res) {
	res.status(200).send({terminal: "BACTSSA", user: "bactssa"});
})