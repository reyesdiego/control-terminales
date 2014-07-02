/**
 * Created by Diego Reyes on 10/6/14.
 */
var email 	= require("emailjs");

email.server = email.server.connect({
		user:    "noreply",
		password:"desarrollo",
		host:    "10.10.0.170",
		port: "25",
		domain: "puertobuenosaires.gov.ar",
		ssl:     false
	});

email.server.send(
	{
		text:		"Testing",
		from:		"AGP <noreply@puertobuenosaires.gob.ar>",
		to:			"AGP <noreply@puertobuenosaires.gob.ar>",
		bcc:		"AGP <noreply@puertobuenosaires.gob.ar>",
		subject:	"Testing"
	}, function(err, message) {
		console.log(err || message);
	});
