/**
 * Created by diego on 6/26/15.
 */

/*
var mail = require("../include/emailjs");

var options = {
    user:    "noreply",
    password: "desarrollo",
    host:    "10.10.0.170",
    port: "25",
    domain: "puertobuenosaires.gob.ar",
    ssl:     false,
    status: true,
    throughBcc: false
}

var mailer = new mail.mail(options);
mailer.send('reyesdiego@hotmail.com', 'Hola', 'Primero', function(err, data) {
    console.log(err);
    console.log(data);
    process.exit();
});
*//*
'use strict';
var em = require("./emailJsTestClass.js")
//var em = require("../include/emailjs");

var ma = new em.mail({
    user: "noreply",
    password: "desarrollo",
    host: "10.10.0.170",
    port: 25,
    domain: "puertobuenosaires.gob.ar",
    ssl: false,
    status: true
});
ma.send("reyesdiego@hotmail.com", "ii", "jj", function (err){
    console.log(err)
});
*/
var con = {
    user: "noreply",
    password: "desarrollo",
    host: "10.10.0.170",
    port: 25,
    domain: "puertobuenosaires.gob.ar",
    ssl: false,
    status: true
};

var email = require("emailjs");

var server = email.server.connect(con);

server.send({to:"reyesdiego@hotmail.com", from: "noreply@puertobuenosaires.gob.ar", text: "J", subject:"KK"}, function (err, me){
    console.log(err);
    console.log(me);
})