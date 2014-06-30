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

var mail = require("./include/emailjs");
var socketio = require('socket.io');

var dateTime = require('./include/moment');

var config = require('./config/config.js');

var app = express();
var server = http.createServer(app);

app.configure(function () {
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
//	app.use(passport.initialize());

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
	var db='<p><b>Versión Mongoose: '+mongoose.version+'</b></p><p><b>MongoDb: </b>';

	if (mongoose.connections.length>0)
		if (mongoose.connections[0]._hasOpened)
			db+='<span style="color:green">Connected</span></p>';
		else
			db+='<span style="color:red">Not connected</span></p>';

	res.send("<h1>Servicio Terminales Portuarias.</h1><p>Administración General de Puertos.</p><br/><b>Versión NodeJs: "+process.version+"</b>"+db+"<p>Runtime: "+server.runtime+"</p>");

	io.sockets.emit('invoice', {status:"OK"})
});

app.get('/log', function(req, res) {

	var filename = 'log/nohup.out';
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<html><body>');
	res.write('<br/><center><p><a name="top" style="font-size: 22px" href="#bottom">Ir a fin de pagina</a></p></center>');

	fs.exists(filename, function(exists){
		if (exists) {
			// serve file
			var lazy = require("lazy")
			new lazy(fs.createReadStream(filename))
				.lines
				.forEach(function(line){
					var n = line.toString().toUpperCase().indexOf("ERROR");
					if (n > 0)
						res.write("<div style='color:red'>"+ line.toString()+"</div>");
					else
						res.write(line.toString()+"<br/>");

				}
			).on('pipe', function(){
					res.write('<center><p><a name="bottom" style="font-size: 22px" href="#top">Ir a inicio de pagina</a></p></center>');
					res.write('</body></html>');
					res.end();
			});
		} else {
			res.write("<h1>No se encuentra Log</h1>");
			res.write('</body></html>');
			res.end();
		}
	});
});

var processArgs = process.argv.slice(2);
var port = processArgs[0] || config.server_port;

server.listen(port, function() {
	server.runtime = dateTime.getDatetime();
	console.log("===============================================================================");
	console.log("%s - Nodejs server Version: %s", dateTime.getDatetime(), process.version);
	console.log("%s - Running on http://localhost:%s", dateTime.getDatetime(), port);
	console.log("===============================================================================");
});

var io = socketio.listen(server);
io.set('log level', 1);
io.on('connection', function (socket){
	console.log('%s - Socket Client Connected.', dateTime.getDatetime());
	socket.on('send', function (data) {
		io.sockets.emit('message', data);
	});
});

//routes = require('./routes/accounts')(app, passport);
require('./routes/accounts')(app);
require('./routes/invoice')(app, io);
require('./routes/price')(app);
require('./routes/matchPrice')(app);
require('./routes/appointment')(app, io);
require('./routes/gate')(app, io);
require('./routes/voucherType')(app);

//	Database configuration
mongoose.connect(config.mongo_url, config.mongo_opts);

mongoose.connection.on('connected', function () {
	console.log("%s - Mongoose version: %s", dateTime.getDatetime(), mongoose.version);
	console.log('%s - Connected to Database. %s', dateTime.getDatetime(), config.mongo_url);
	console.log("===============================================================================");
});
mongoose.connection.on('error',function (err) {
	console.error('%s - ERROR: connecting to Database. %s', dateTime.getDatetime(), err);
	console.log("===============================================================================");
});
mongoose.connection.on('disconnected', function () {
	console.log('Mongoose default connection disconnected');
	console.log("===============================================================================");
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
	mongoose.connection.close(function () {
		console.log('Mongoose default connection disconnected through app termination');
		console.log("===============================================================================");
		console.log("process.env.NODE_ENV %s", process.env.NODE_ENV)
		if (process.env.NODE_ENV === 'production'){
			var mailer = new mail.mail(config.email);
			mailer.send('noreply@puertobuenosaires.gob.ar', 'AGP-TERAPI - ERROR', 'Mongoose default connection disconnected', function() {
				process.exit(0);
			});
		} else {
			process.exit(0);
		}
	});
});

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});
