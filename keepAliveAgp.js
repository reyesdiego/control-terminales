/**
 * Created by diego on 7/31/14.
 */

var http = require('http');
var mail = require('./include/emailjs');

var interval = 5 * 60 * 1000; // 5 minutos
var errorCount = 0;
var emailSent = 0;
var allowSending = true;

var optionsget = {
	host : process.argv[2], // here only the domain name (no http/https !)
	port : process.argv[3],
	path : '/',
	method : 'GET'
};

console.info('KeepAlive AgpApi on host:%s port:%s has started successfully...', process.argv[2], process.argv[3]);

var reqGet;

setInterval(request, interval);

function request(){
	reqGet = http.request(optionsget, function(res) {
		if (res.statusCode === 200){
			console.error("OK, statusCode: ", res.statusCode);
			errorCount = 0;
			allowSending = true;
			emailSent = 0;
		} else {
			console.log("Se Cayo: ", res.statusCode);
		}

//	console.log("headers: ", res.headers);
		/*
		 res.on('data', function(d) {
		 console.info('GET result:\n');
		 process.stdout.write(d);
		 console.info('\n\nCall completed');
		 });
		 */
	});

	reqGet.end();

	reqGet.on('error', function(e) {

		if (errorCount++ === 2){
			console.error(e);
			errorCount=0;

			var mailer = new mail.mail(allowSending);
			mailer.send(["reyesdiego@hotmail.com", "dreyes@puertobuenosaires.gob.ar"], "Servicio AGP detenido.", JSON.stringify(optionsget), function(){
				emailSent++;
				console.log('emailSent: %s', emailSent);
				if (emailSent === 2){
					console.log("\nque no mande mas mail\n")
					allowSending = false;
					process.exit(code=0);
				}

			});
		}

	});
}

