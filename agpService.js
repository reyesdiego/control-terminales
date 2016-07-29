/**
 * Created by diego on 8/28/14.
 */

var mongoose = require('mongoose');
var Account = require('./models/account.js');
var Invoices = require('./models/invoice.js');
var VouchersType = require('./models/voucherType.js');
var http = require('http');
var mail = require('./include/emailjs');
var config = require('./config/config.js');
var async = require("async");
var asyncTerminals = require("async");
var moment = require('moment');
var Enumerable = require('linq');
var jade = require('jade');

var date = moment().format('DD-MM-YYYY');

var asyncParallel = [];
var terminalsName = ['bactssa', 't4', 'trp'];
var to = ["dreyes@puertobuenosaires.gob.ar", "reclamosuct@puertobuenosaires.gob.ar"];

var sendToClient = true;
var sendMail = config.email;

var host = config.domain;

mongoose.connect(config.mongo.url, config.mongo.options);

VouchersType.find({}, (err, vouchersDesc) => {
    'use strict';
    var voucherList = {};

    if (err) {

    } else {
        vouchersDesc.forEach(item => {
            voucherList[item._id] = item.description;
        });

        Account.find({user: {$in: terminalsName}}, {terminal: 1, token: 1, email: 1, full_name: 1})
            .lean()
            .exec((err, terminals) => {
                var functionObject;
                asyncTerminals.eachSeries(terminals, (user, callbackTerminal) => {

                        if (err) {
                            console.error(err);
                        } else {

                            let toLocal = [];
                            if (sendToClient === true) {
                                toLocal.push(user.email);
                            }
                            to.forEach(item => {toLocal.push(item);});

                            /** CODIGOS NO ASOCIADOS */
                            functionObject = callback =>  {
                                var optionsget,
                                    reqGet;

                                optionsget = {
                                    host : host, // here only the domain name (no http/https !)
                                    port : 8090,
                                    path : '/matchPrices/noMatches/' + user.terminal,
                                    method : 'GET',
                                    headers : {token: user.token.token}
                                };

                                reqGet = http.request(optionsget, res => {
                                    var resData = '';
                                    res.on('data', d => {
                                        resData += d;
                                    });

                                    res.on('end', () => {
                                        var result = JSON.parse(resData),
                                            mailer;

                                        if (result.status === 'OK') {
                                            if (result.data.length > 0) {
                                                mailer = new mail.mail(sendMail);
                                                let subject = `${result.data.length.toString()} códigos no asociados al ${date}`;
                                                let html = user.terminal + '\n\n' + result.data;
                                                mailer.send(toLocal, subject, html, err => {
                                                    if (err) {
                                                        console.log('No se envió mail. %s', subject);
                                                    } else {
                                                        console.log('Se envió mail a %s - %s', toLocal, moment());
                                                    }
                                                    return callback(err, result.data);
                                                });
                                            } else {
                                                return callback(undefined, result.data);
                                            }
                                        } else {
                                            return callback();
                                        }
                                    });
                                });

                                reqGet.end(); // ejecuta el request
                            };
                            asyncParallel.push(functionObject);

                            /** CORRELATIVIDAD */
                            Invoices.distinct('nroPtoVenta', {terminal: user.terminal}, (err, data) => {
                                if (!err) {
                                    Invoices.distinct('codTipoComprob', {terminal: user.terminal}, (err, voucherTypes) => {
                                        if (!err) {
                                            voucherTypes.forEach( voucher => {
                                                functionObject = callback => {
                                                    var optionsget,
                                                        reqGet;

                                                    optionsget = {
                                                        host: host, // here only the domain name (no http/https !)
                                                        port: 8090,
                                                        path: `/invoices/correlative/${user.terminal}?codTipoComprob=${voucher}&nroPtoVenta=${data}&fechaInicio=2014-08-01&fechaFin=2020-01-01`,
                                                        method: 'GET',
                                                        headers: {token: user.token.token}
                                                    };

                                                    reqGet = http.request(optionsget, res => {
                                                        var resData = '';
                                                        res.on('data', d => {
                                                            resData += d;
                                                        });

                                                        res.on('end', () => {
                                                            var result = JSON.parse(resData),
                                                                totalCnt,
                                                                mailer,
                                                                subject;

                                                            if (result.status === 'OK') {
                                                                totalCnt = Enumerable.from(result.data).sum(item => {return item.totalCount;});
                                                                result = Enumerable.from(result.data).where(item => {
                                                                    var response = false;
                                                                    if (item.totalCount > 0) {
                                                                        response = true;
                                                                    }
                                                                    return response;
                                                                }).toArray();

                                                                if (result.length > 0) {
                                                                    jade.renderFile(__dirname + '/public/correlatividadMail.jade', {
                                                                        param: result,
                                                                        voucher: voucherList[voucher.toString()],
                                                                        terminal: user.full_name,
                                                                        moment: moment,
                                                                        totalCount: totalCnt
                                                                    }, function (err, html) {
                                                                        html = {
                                                                            data: html,
                                                                            alternative: true
                                                                        };
                                                                        mailer = new mail.mail(sendMail);
                                                                        subject = `${voucherList[voucher.toString()]}: ${totalCnt.toString()} faltantes al ${date}`;
                                                                        mailer.send(toLocal,
                                                                            subject,
                                                                            html,
                                                                            function (err, dataMail) {
                                                                                if (err) {
                                                                                    console.log('No se envió mail. %s, %s', err.data, JSON.stringify(result));
                                                                                } else {
                                                                                    console.log('Se envió mail a %s - %s', toLocal, moment());
                                                                                }
                                                                                return callback(err, result);
                                                                            });
                                                                    });
                                                                } else {
                                                                    return callback(undefined, result.data);
                                                                }
                                                            } else {
                                                                console.error('ERROR: %j', result.data);
                                                                return callback();
                                                            }
                                                        });
                                                    });
                                                    reqGet.end(); // ejecuta el request
                                                };
                                                asyncParallel.push(functionObject);
                                            });
                                            callbackTerminal();
                                        } else {
                                            callbackTerminal(err);
                                        }
                                    });

                                } else {
                                    callbackTerminal();
                                }
                            });
                        }

                    },
                    () => {
                        console.log('--------%s--------', moment().format("DD-MM-YYYY"));
                        async.parallel(asyncParallel, () => {
                            process.exit();
                        });
                    });

            });
    }
});
