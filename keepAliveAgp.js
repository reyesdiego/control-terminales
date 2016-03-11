/**
 * Created by diego on 7/31/14.
 */

var http = require('http'),
    mail = require('./include/emailjs'),
    config = require('./config/config.js');

//var interval = 5 * 60 * 1000, // 5 minutos
var minutos = process.argv[4];
var interval,
    emailSent = 0,
    mailOptions = config.emailTurnos,
    optionsget = {
        host: process.argv[2], // here only the domain name (no http/https !)
        port: process.argv[3],
        path: '/',
        method: 'GET',
        timeout: 20
    };

if (minutos) {
    interval = minutos * 60 * 1000; //minutos
} else {
    interval = 5000; // 5seg
}


console.info('KeepAlive AgpApi on host:%s port:%s has started successfully. Pid: %s', process.argv[2], process.argv[3], process.pid);

var reqGet;

setInterval(request, interval);

function request() {
    'use strict';
    reqGet = http.request(optionsget, function (res) {
        let mailer,
            to= ["reyesdiego@hotmail.com", "dreyes@puertobuenosaires.gob.ar"];
        if (res.statusCode === 200) {
            mailOptions.status = true;
            if (emailSent === 2) {
                mailer = new mail.mail(mailOptions);
                mailer.send(to, "Servicio AGP Reestablecido", JSON.stringify(optionsget), function (err, message) {
                    if (err) {
                        console.log("Error enviando email. %j, %s", err, new Date());
                    } else {
                        console.log('emailSent %s a %s - %s', emailSent, to, new Date());
                    }
                });
            }
            emailSent = 0;
            console.log('+');
        } else {
            console.log("Se Cayo: ", res.statusCode);
        }
        var chunk1;
        res.on('data', function (chunk) {
            chunk1 += chunk;
        });
        res.on('end', function () { });

    });

    reqGet.end();

    reqGet.on('error', function (e) {

        var mailer = new mail.mail(mailOptions),
            to = ["reyesdiego@hotmail.com", "dreyes@puertobuenosaires.gob.ar"];
        if (mailOptions.status) {
            mailer.send(to, "Servicio AGP detenido", JSON.stringify(optionsget), function (err, message) {
                if (err) {
                    console.log("Error enviando email. %j, %s", err, new Date());
                } else {
                    emailSent++;
                    console.log('emailSent %s a %s - %s', emailSent, to, new Date());
                    if (emailSent === 2) {
                        console.log("\nEnvio de Alertas Finalizado hasta tanto se reinicie el servicio %s\n", new Date());
                        mailOptions.status = false;
                        //process.exit(0);
                    }
                }
            });
        }
});
}
