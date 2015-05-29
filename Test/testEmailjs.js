/**
 * Created by Diego Reyes on 10/6/14.
 */
/*
var email = require("emailjs");

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
        text:    "Testing",
        from:    "AGP <noreply@puertobuenosaires.gob.ar>",
        to:     "dreyes@puertobuenosaires.gob.ar",
        bcc:    "dreyes@puertobuenosaires.gob.ar",
        subject:    "Testing",
        attachment:
            [
                {data:"<html>i <i>hope</i> this works!</html>", alternative:true}
            ]
    }, function(err, message) {
        console.log(err || message);
    });
*/

var mail = require("../include/emailjs");

var options = {
	user:    "noreply",
	password: "desarrollo",
	host:    "10.10.0.170",
	port: "25",
	domain: "puertobuenosaires.gov.ar",
	ssl:     false,
	status: true,
	throughBcc: true
}

var mailer = new mail.mail(options);
var html = {
    data : "<html><body><p>Ud. a solicitado un usario para ingresar a la página de Control de Información de Terminales portuarias. Para activar el mismo deberá hacer click al siguiente link http://terminales.puertobuenosaires.gob.ar:8080/unitTypes?key=TEST</p></body></html>",
    alternative: true
};

//mailer.send("reyesdiego@hotmail.com", "Nuevo Usuario", null, html, function(messageBack){
//console.log('Se envio un mail a %j', messageBack);
//});

//mailer.send("reyesdiego@hotmail.com", "Nuevo Usuario", html, function(messageBack){
//console.log('Se envio un mail a %j', messageBack);
//});

//mailer.send("reyesdiego@hotmail.com", "Con html sin callback", html);

//mailer.send(["reyesdiego@hotmail.com", "dreyes@puertobuenosaires.gob.ar"], "Con text sin callback sin html", "TESTING");
//mailer.send("reyesdiego@hotmail.com", "Con text sin callback sin html", "TESTING");

//mailer.send("reyesdiego@hotmail.com", "Nuevo Usuario", "TESTING SOLO TEXTO SIN HTML CON CALLBACK", function(messageBack){
//console.log('Se envio un mail a %j', messageBack);
//});

mailer.send('reyesdiego@hotmail.com', 'jola', 'Primero', function (err, messageBack) {
	if (err) {
		console.log(err);
		mailer = new mail.mail(options);
		mailer.send('reyesdiego@hotmail.com', 'jola', 'Primero', function (err2, messageBack2) {
			if (err2) {
				console.log(err2);
			}
		});

	} else {
		console.log(messageBack);
	}
});

