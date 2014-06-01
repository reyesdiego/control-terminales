/**
 * Created by Administrator on 6/1/14.
 */

var email   = require("emailjs");
var server  = email.server.connect({
	user:    "reyesdiego3060@gmail.com",
	password:"gcomputer",
	host:    "smtp.gmail.com",
	ssl:     true
});

// send the message and get a callback with an error or details of the message that was sent
server.send({
	text:    "i hope this works",
	from:    "Diego Reyes <reyesdiego3060@gmail.com>",
	to:      "someone <reyesdiego@hotmail.com>",
//	cc:      "else <else@gmail.com>",
	subject: "testing emailjs"
}, function(err, message) { console.log(err || message); });
