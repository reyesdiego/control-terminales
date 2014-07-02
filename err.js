/**
 * Created by Administrator on 3/13/14.
 */
var cluster = require('cluster');

var workers = process.env.WORKERS || require('os').cpus().length;

if (cluster.isMaster) {

	console.log('start cluster with %s workers', workers);

	for (var i = 0; i < workers; ++i) {
		var worker = cluster.fork().process;
		console.log('worker %s started.', worker.pid);
	}

	cluster.on('exit', function(worker) {
		console.log('worker %s died. restart...', worker.process.pid);
		cluster.fork();
	});

} else {
	var express		=	require('express');
	var http = require('http');

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

	app.get('/g', function (req,res){
		console.log(cluster.worker.id);
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(cluster.worker.id.toString());
		res.end();
	});

	server.listen(3000, function() {
		console.log("===============================================================================");
		console.log("- Nodejs server Version: %s", process.pid);
	});

//	http.createServer(function (req, res) {
//		res.end("Look Mum! I'm a server!\n");
//	}).listen(3000, "127.0.0.1");
//	console.log('yo');

}

process.on('uncaughtException', function (err) {
	console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
	console.error(err.stack)
	process.exit(1)
})