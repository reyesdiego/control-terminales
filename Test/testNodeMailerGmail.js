/**
 * Created by diego on 12/11/15.
 */

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport(smtpTransport({
    host: '10.10.0.176',
    port: 25,
    //secure: false,
    //debug: true,
    //ignoreTLS: true,
    //localAddress: "10.1.0.61",
    /*auth: {
        user: '',
        pass: ''
    }*/
}));

transporter.sendMail({
    from: 'noreply@puertobuenosaires.gob.ar',
    to: 'reyesdieXX95go@hotmail.com',
    subject: 'hello world!',
    text: 'Authenticated with OAuth2'
}, function(error, response) {
    if (error) {
        console.log(error);
    } else {
        console.log('Message sent %s', JSON.stringify(response));
    }
});

// create reusable transporter object using SMTP transport

/*
var transporter = nodemailer.createTransport({
cd Te    service: 'Gmail',
    auth: {
        user: 'reyesdiego@hotmail.com',
        pass: ''
    }
});
*/
/*
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'reyesdiego3060@gmail.com',
        pass: 'gcomputer'
    }
}, {
    // default values for sendMail method
    from: 'reyesdiego3060@gmail.com',
    headers: {
        'My-Awesome-Header': '123'
    }
});
transporter.sendMail({
    to: 'reyesdiego@hotmail.com',
    subject: 'hello',
    text: 'hello world!'
});
*/


/*
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

});*/