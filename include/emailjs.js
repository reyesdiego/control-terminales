/**
 * Created by Diego Reyes on 10/6/14.
 */
var email 	= require("emailjs");

var mail = function (status){

	this.status = status;
	this.server = email.server.connect({
		user:    "noreply",
		password:"desarrollo",
		host:    "10.10.0.170",
		port: "25",
		domain: "puertobuenosaires.gov.ar",
		ssl:     false
	});
};

mail.prototype = {
	send : function (to, subject, text, attachment, callback){

		if (typeof text === 'object'){
			if (typeof attachment === 'function'){
				callback = attachment;
			}
			attachment = text;
			text = '';
		} else {
			if (typeof attachment === 'function'){
				callback = attachment;
			}
		}

		if (this.status === true){
			this.server.send(
				{
					text:		text,
					from:		"A.G.P. <noreply@puertobuenosaires.gob.ar>",
					to:			to,
					bcc:		"A.G.P. <noreply@puertobuenosaires.gob.ar>",
					subject:	subject,
					attachment: (attachment) ? attachment : []
				}, function(err, message) {
					console.log(err || message);
					if (typeof callback === 'function')
						callback(message);
				});
		}
	}
};

exports.mail = mail;
