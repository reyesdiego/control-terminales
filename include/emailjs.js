/**
 * Created by Diego Reyes on 10/6/14.
 */
var email 	= require("emailjs");

var mail = function (){

	this.server = email.server.connect({
		user:    "noreply",
		password:"desarrollo",
		host:    "10.10.0.170",
		port: "25",
		domain: "puertobuenosaires.gov.ar",
		ssl:     false
	});
};
//TODO cambiar cuenta por noreply y recibir parametro para ver si manda o no de acuerdo
//a la configuracion (mandar mail de error o no por mail)
mail.prototype = {
	send : function (to, subject, text, callback){
		this.server.send(
			{
				text:		text,
				from:		"AGP <noreply@puertobuenosaires.gob.ar>",
				to:			to,
				bcc:		"AGP <noreply@puertobuenosaires.gob.ar>",
				subject:	subject
		}, function(err, message) {
			console.log(err || message);
			if (callback !== undefined && callback != null)
				callback();
		});
	}
};

exports.mail = mail;
