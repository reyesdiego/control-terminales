/**
 * Created by diego on 7/31/14.
 */

var http = require('http'),
    mail = require('./include/emailjs'),
    config = require('./config/config.js');

var pm2 = require('pm2');

var serviceName = process.argv[2];
var minutos = process.argv[5];
var interval,
    emailSent = 0,
    mailOptions = config.email,
    optionsget = {
        host: process.argv[3], // here only the domain name (no http/https !)
        port: process.argv[4],
        path: '/',
        method: 'GET',
        timeout: 20
    };

if (minutos) {
    interval = minutos * 60 * 1000; //minutos
} else {
    interval = 5000; // 5seg
}

console.info('KeepAlive AgpApi on host:%s port:%s has started successfully. Pid: %s', process.argv[3], process.argv[4], process.pid);

var reqGet;

setInterval(request, interval);

function request() {
    'use strict';
    reqGet = http.request(optionsget, (res) => {
        let mailer,
            to= ["reyesdiego@hotmail.com", "dreyes@puertobuenosaires.gob.ar"];
        if (res.statusCode === 200) {
            mailOptions.status = true;
            if (emailSent > 0 ) {
                mailer = new mail.mail(mailOptions);
                mailer.send(to, "Servicio AGP Reestablecido", JSON.stringify(optionsget), function (err, message) {
                    if (err) {
                        console.log("Error enviando email. %j, %s", err, new Date());
                    } else {
                        console.log('Reestablecido - emailSent %s a %s - %s', emailSent, to, new Date());
                    }
                });
                emailSent = 0;
            }
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
        emailSent++;
        pm2.connect((err) => {
            if (err) {
                console.error(err);
            } else {
                pm2.restart(serviceName, function (err) {
                    pm2.disconnect();
                    if (emailSent > 0 && emailSent < 3) {
                        var mailer = new mail.mail(mailOptions),
                            to = ["reyesdiego@hotmail.com", "dreyes@puertobuenosaires.gob.ar"];
                        var subject = `Servicio ${serviceName} - AGP detenido`;
                        mailer.send(to, subject, JSON.stringify(optionsget), function (err) {

                            if (err) {
                                console.log("Error enviando email. %j, %s", err, new Date());
                            } else {
                                emailSent++;
                                console.log('Caído - emailSent %s a %s - %s', emailSent, to, new Date());
                                if (emailSent === 2) {
                                    console.log("\nEnvio de Alertas Finalizado hasta tanto se reinicie el servicio %s\n", new Date());
                                }
                            }
                        });
                    }
                });
            }
        });
    });
}