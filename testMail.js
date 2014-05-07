/**
 * Created by diego on 4/30/14.
 */

var https = require('https');
https.globalAgent.options.secureProtocol = 'SSLv3_method';

var nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport("SMTP", {
	host: "correo.agp.gob.ar", // hostname
	secureConnection: true, // use SSL
	port: 25, // port for secure SMTP
	debug:true,
	auth: {
		user: "dreyes@puertobuenosaires.gob.ar",
//		user: "reyes-d",
		pass: "DLR10041973_"
	}
});

//var smtpTransport = nodemailer.createTransport("SMTP", {
//	host: "smtp.gmail.com", // hostname
//	secureConnection: true, // use SSL
//	port: 465, // port for secure SMTP
//	auth: {
//		user: "reyesdiego3060@gmail.com",
//		pass: "gcomputer"
//	}
//});

//var smtpTransport = nodemailer.createTransport("SMTP", {
//	host: "Hotmail", // hostname
//	secureConnection: true, // use SSL
//	port: 465, // port for secure SMTP
//	auth: {
//		user: "reyesdiego@hotmail.com",
//		pass: "_DLR10041973_"
//	}
//});

//var smtpTransport = nodemailer.createTransport("SMTP",{
//	service: "AGP",
//	auth: {
//		user: "reyesdiego@hotmail.com",
//		pass: "_DLR10041973_"
//	}
//});

// setup e-mail data with unicode symbols
var mailOptions = {
	from: "Diego Reyes ✔ <dreyes@puertobuenosaires.gob.ar>", // sender address
	to: "reyesdiego@hotmail.com", // list of receivers
	subject: "Hello ✔", // Subject line
	text: "Hello world ✔", // plaintext body
	html: "<b>Hello world ✔</b>" // html body
}


smtpTransport.sendMail(mailOptions, function(error, response){
	if(error){
		console.log({"error": error, response: response});
	}else{
		console.log("Message sent: " + response.message);
	}

	// if you don't want to use this transport object anymore, uncomment following line
	//smtpTransport.close(); // shut down the connection pool, no more messages
});


process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});

