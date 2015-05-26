/**
 * Created by diego on 5/14/15.
 */

var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    user:     "noreply",
    password: "desarrollo",
    host:     "10.10.0.170",
    port: "25",
    auth: {
        user: 'noreply',
        pass: 'desarrollo'
    }
});

// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'Fred Foo ✔ <noreply@puertobuenosaires.gob.ar>', // sender address
    to: 'reyesdiego@hotmail.com, bffffaz@brdybloop.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ✔', // plaintext body
    html: '<b>Hello world ✔</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
    }else{
        console.log('Message sent: ' + JSON.stringify(info));
    }
});