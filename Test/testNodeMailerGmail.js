/**
 * Created by diego on 12/11/15.
 */

var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport

/*
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'reyesdiego@hotmail.com',
        pass: ''
    }
});
*/


var transporter = nodemailer.createTransport({
    host: "10.10.0.176", // hostname
    secureConnection: false, // use SSL
    domain: "puertobuenosaires.gob.ar",
    port: 25, // port for secure SMTP
    auth: {
        user: "",
        pass: ""
    }
});




// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'Fred Foo ✔ <reyesdiego3060@gmail.com>', // sender address
    to: 'reyesdiego@hotmail.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ✔', // plaintext body
    html: '<b>Hello world ✔</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);

});