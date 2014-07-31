/**
 * Created by diego on 7/31/14.
 */

var http = require('http');
var mail = require('./include/emailjs');

var interval = 2 * 1000;
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

		if (errorCount++ === 3){
			console.error(e);
			errorCount=0;

			var mailer = new mail.mail(allowSending);
			mailer.send("dreyes@puertobuenosaires.gob.ar", "AGP Service is down", optionsget, function(){
				emailSent++;
				console.log('emailSent: %s', emailSent);
				if (emailSent === 2){
					console.log("\nque no mande mas mail\n")
					allowSending = false;
				}

			});

//			process.exit(code=0);
		}

	});
}

