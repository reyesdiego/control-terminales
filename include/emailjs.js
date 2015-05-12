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

	this.emailSimpleValidate = function (email) {
		var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
		if (reg.test(email)){
			return true; }
		else{
			return false;
		}
	};

	this.emailCaseSensitiveValidate = function (email) {
		var reg = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
		if (reg.test(email)){
			return true;
		}
		else{
			return false;
		}
	};

	this.emailFreeValidate = function (email) {
		var reg = /^([\w-\.]+@(?!gmail.com)(?!yahoo.com)(?!hotmail.com)([\w-]+\.)+[\w-]{2,4})?$/
		if (reg.test(email)){
			return true;
		}
		else{
			return false;
		}
	}

};

mail.prototype = {
	send : function (to, subject, text, attachment, callback){

		var self = this;
		var tos = [];

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

		if (typeof to === 'string'){
			if (!this.emailSimpleValidate(to)){
				return callback ({status:"ERROR", data:"La cuenta de email es inválida"});
			} else {
				tos.push(to);
			}
		} else if (typeof to === 'object') {
			to.forEach(function (item){
				if (!self.emailSimpleValidate(item)){
					return callback ({status:"ERROR", data:"La cuenta de email es inválida"});
				}
			});
			tos = to;
		}

		if (this.status === true){
			this.server.send(
				{
					text:		text,
					from:		"A.G.P. <noreply@puertobuenosaires.gob.ar>",
					to:			"A.G.P. <noreply@puertobuenosaires.gob.ar>",
					bcc:		tos.join(','),
					subject:	subject,
					attachment: (attachment) ? attachment : []
				}, function(err, message) {
					if (err) {
						if (typeof callback === 'function')
							return callback(err);

					} else {
						if (typeof callback === 'function')
							return callback(null, message);

					}
				});
		}
	}
};

exports.mail = mail;
