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

var socketio = require('socket.io');

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
	var db='<p><b>MongoDb: </b>';

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
	res.write('<p><a href="#bottom">Ir a fin de pagina</a></p>');

	path.exists(filename, function(exists){
		if (exists) {
			// serve file
			var lazy = require("lazy")
			new lazy(fs.createReadStream(filename))
				.lines
				.forEach(function(line){
					var n = line.indexOf("error");
					if (n > 0)
						res.write("<div style='color:red'>"+ line.toString()+"</div><br/>");
					else
						res.write(line.toString()+"<br/>");

				}
			).on('pipe', function(){
					res.write('<p><a name="bottom">Fin normal del log</a></p>');
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
	console.log("%s - Node server Version: %s", dateTime.getDatetime(), process.version);
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
routes = require('./routes/accounts')(app);
routes = require('./routes/invoice')(app, io);
routes = require('./routes/price')(app);
routes = require('./routes/matchPrice')(app);
routes = require('./routes/appointment')(app, io);
routes = require('./routes/gate')(app, io);


//	Database configuration
mongoose.connect(config.mongo_url, config.mongo_opts);

mongoose.connection.on('connected', function () {
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
		process.exit(0);
	});
});

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});
