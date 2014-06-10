/**
 * Created by Diego Reyes on 10/6/14.
 */
var email 	= require("emailjs");

var mail = function (){

	this.server = email.server.connect({
		user:    "reyes-d",
		password:"DLR10041973_",
		host:    "10.10.0.170",
		port: "25",
		domain: "puertobuenosaires.gov.ar",
		ssl:     false
	});
};
mail.prototype = {
	send : function (to, subject, text, callback){
		this.server.send({
			text:    text,
			from:    "Diego Reyes <dreyes@puertobuenosaires.gov.ar>",
			to:      to,
			//cc:      "else <else@gmail.com>",
			subject: subject
		}, function(err, message) { console.log(err || message); callback()});
	}
};

exports.mail = mail;
