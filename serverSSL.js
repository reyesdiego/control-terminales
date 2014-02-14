/**
 * Created by Diego Reyes on 2/7/14.
 */

var express		= require('express'),
	https		= require('https'),
	mongoose	= require('mongoose'),
	passport	= require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	path		= require('path');

var fs = require('fs');

var config = require(__dirname + '/config/config.js');

var options = {
	key: fs.readFileSync('./certificates/key.pem'),
	cert: fs.readFileSync('./certificates/cert.pem'),
	// Ask for the client's cert
	requestCert: false,
	// Don't automatically reject
	rejectUnauthorized: false
};

var app = express();
var server = https.createServer(options, app);

app.configure(function () {
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(passport.initialize());
	app.use(app.router);
});

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", 'X-Requested-With, Content-Type, token');
	res.header('Access-Control-Allow-Methods', 'GET, POST', 'DELETE', 'PUT', 'OPTIONS');
	res.header('Access-Control-Request-Method', 'GET');
	res.header('Access-Control-Request-Headers', 'token');

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
//	res.send("Servicio Rest Terminales Portuarias. A.G.P.");
		if (req.client.authorized) {
		res.writeHead(200, {"Content-Type":"application/json"});
		res.end('{"status":"approved"}');
		// console.log(req.client);
		console.log("Approved Client ", req.client.socket.remoteAddress);
	} else {
		res.writeHead(401, {"Content-Type":"application/json"});
		res.end('{"status":"denied"}');
		// console.log(req.client);
		console.log("Denied Client " , req.client.socket.remoteAddress);
	}
});

mongoose.connect(config.mongo_url, function(err, res) {
	if(err) {
		console.log('ERROR: connecting to Database. ' + err);
	} else {
		console.log('Connected to Database');
	}
});

routes = require('./routes/accounts')(app, passport);
routes = require('./routes/invoice')(app);
routes = require('./routes/priceList')(app);

var port = 8080;
server.listen(port, function() {
	console.log("Node server running on http://localhost:%s", port);
});


