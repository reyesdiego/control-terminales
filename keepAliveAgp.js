/**
 * Created by diego on 7/31/14.
 */

var http = require('http');
var mail = require('./include/emailjs');

var interval = 5 * 60 * 1000; // 5 minutos
var emailSent = 0;
var allowSending = true;

var optionsget = {
	host : process.argv[2], // here only the domain name (no http/https !)
	port : process.argv[3],
	path : '/',
	method : 'GET'
};

console.info('KeepAlive AgpApi on host:%s port:%s has started successfully. Pid: %s', process.argv[2], process.argv[3], process.pid);

var reqGet;

setInterval(request, interval);

function request(){
	reqGet = http.request(optionsget, function(res) {
		if (res.statusCode === 200){
			allowSending = true;
			emailSent = 0;
		} else {
			console.log("Se Cayo: ", res.statusCode);
		}
	});

	reqGet.end();

	reqGet.on('error', function(e) {
			var mailer = new mail.mail(allowSending);
			var to = ["reyesdiego@hotmail.com", "dreyes@puertobuenosaires.gob.ar"];
			mailer.send(to, "Servicio AGP detenido (testing)", JSON.stringify(optionsget), function(err, message){
				if (err) {
					console.log("Error enviando email.")
				} else {
					emailSent++;
					console.log('emailSent %s a %s - %s', emailSent, message.header.to, new Date());
					if (emailSent === 2){
						console.log("\nProceso terminado %s\n", new Date());
						allowSending = false;
						process.exit(code=0);
					}
				}
			});
	});
}

