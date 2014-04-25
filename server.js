/**
 * Created by Diego Reyes on 1/7/14.
 */
var express		=	require('express'),
	http		=	require('http'),
	mongoose	=	require('mongoose'),
	passport	=	require('passport'),
	LocalStrategy =	require('passport-local').Strategy,
	path		=	 require('path'),
	fs			=	require('fs');

var dateTime = require('./include/moment');

var config = require(__dirname + '/config/config.js');

var app = express();
var server = http.createServer(app);

app.configure(function () {
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(passport.initialize());

});


app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", 'X-Requested-With, Content-Type, token');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//	res.header('Access-Control-Request-Method', 'GET');
	res.header('Access-Control-Request-Headers', 'Content-Type, token');

	if ('OPTIONS' == req.method) {
		res.send(200);
	}
	else {
		next();
	}
//	next();
});

var Account = require(__dirname +'/models/account');
passport.use(Account.createStrategy());

app.get('/', function(req, res) {
	res.send("<h1>Servicio Terminales Portuarias.</h1><p>Administración General de Puertos.</p><br/><b>Versión NodeJs: "+process.version+"</b><p>Runtime: "+server.runtime+"</p>");
});

app.get('/log', function(req, res) {

	var filename = 'nohup.out';
	res.writeHead(200, {'Content-Type': 'text/html'});

	path.exists(filename, function(exists){
		if (exists) {
			// serve file
			var lazy = require("lazy")
			new lazy(fs.createReadStream(filename))
				.lines
				.forEach(function(line){
					res.write(line.toString()+"<br/>");
				}
			).on('pipe', function(){
					res.end();
			});
		} else {
			res.write("<h1>No se encuentra Log</h1>");
			res.end();
		}
	});
});

mongoose.connect(config.mongo_url, function(err, res) {
	if(err) {
		console.error('%s - ERROR: connecting to Database. %s', dateTime.getDatetime(), err);
	} else {
		console.log('%s - Connected to Database. %s', dateTime.getDatetime(), config.mongo_url);
	}
	console.log("===============================================================================");
});

//routes = require('./routes/accounts')(app, passport);
routes = require('./routes/accounts')(app);
routes = require('./routes/invoice')(app);
routes = require('./routes/price')(app);
routes = require('./routes/matchPrice')(app);
routes = require('./routes/appointment')(app);
routes = require('./routes/gate')(app);

var processArgs = process.argv.slice(2);
var port = processArgs[0] || config.server_port;
server.listen(port, function() {
	server.runtime = dateTime.getDatetime();
	console.log("===============================================================================");
	console.log("%s - Node server Version: %s", dateTime.getDatetime(), process.version);
	console.log("%s - Running on http://localhost:%s", dateTime.getDatetime(), port);
	console.log("===============================================================================");
});

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});


app.get('/test', function(req, res){
	var incomingToken = req.headers.token;
	Account.verifyToken(incomingToken, function(err, usr) {
		if (err) {
			res.send(err);
		} else {
			console.log(usr);
			res.send({"test": "OK", user: usr});
		}
	});
})

