/**
 * Created by diego on 4/30/14.
 */

var nodemailer = require('nodemailer');


var smtpTransport = nodemailer.createTransport("SMTP",{
	service: "AGP",
	auth: {
		user: "reyesdiego@hotmail.com",
		pass: "_DLR10041973_"
	}
});

// setup e-mail data with unicode symbols
var mailOptions = {
	from: "Diego Reyes ✔ <reyesdiego@reyesdiego.com>", // sender address
	to: "reyesdiego@hotmail.com", // list of receivers
	subject: "Hello ✔", // Subject line
	text: "Hello world ✔", // plaintext body
	html: "<b>Hello world ✔</b>" // html body
}


smtpTransport.sendMail(mailOptions, function(error, response){
	if(error){
		console.log(error);
	}else{
		console.log("Message sent: " + response.message);
	}

	// if you don't want to use this transport object anymore, uncomment following line
	//smtpTransport.close(); // shut down the connection pool, no more messages
});


process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});

