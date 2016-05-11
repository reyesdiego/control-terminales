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
var sendMail = config.email;

var host = config.domain;

mongoose.connect(config.mongo.url, config.mongo.options);

VouchersType.find({}, function (err, vouchersDesc) {
    'use strict';
    var voucherList = {};
    vouchersDesc.forEach(function (item) {
        voucherList[item._id] = item.description;
    });

    Account.findAll({user: {$in: terminalsName}}, {terminal: 1, token: 1, email: 1, full_name: 1}, function (err, terminals) {
        var functionObject;
        asyncTerminals.eachSeries(terminals, function (user, callbackTerminal) {

            if (err) {
                console.error(err);
            } else {
                /** CODIGOS NO ASOCIADOS */
                functionObject = function (callback) {
                    var optionsget,
                        reqGet;

                    optionsget = {
                        host : host, // here only the domain name (no http/https !)
                        port : 8090,
                        path : '/matchPrices/noMatches/' + user.terminal,
                        method : 'GET',
                        headers : {token: user.token.token}
                    };

                    reqGet = http.request(optionsget, function (res) {
                        var resData = '';
                        res.on('data', function (d) {
                            resData += d;
                        });

                        res.on('end', function () {
                            var result = JSON.parse(resData),
                                mailer,
                                to;

                            if (result.status === 'OK') {
                                console.log('%s, %s', user.terminal, result.data);
                                if (result.data.length > 0) {
                                    mailer = new mail.mail(sendMail);
                                    to = ["dreyes@puertobuenosaires.gob.ar", user.email];
                                    mailer.send(to,
                                        result.data.length.toString() + " CÓDIGOS SIN ASOCIAR AL " + date,
                                        user.terminal + '\n\n' + result.data,
                                        function (err, dataMail) {
                                            if (err) {
                                                console.log('No se envió mail. %s', err.data);
                                            } else {
                                                console.log(user.email);
                                                console.log('Se envió mail a %s - %s', to, moment());
                                            }
                                        });

                                    return callback();
                                } else {
                                    return callback();
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
                Invoices.distinct('nroPtoVenta', {terminal: user.terminal}, function (err, data) {
                    if (!err) {
                        Invoices.distinct('codTipoComprob', {terminal: user.terminal}, function (err, voucherTypes) {
                            if (!err) {
                                voucherTypes.forEach(function (voucher) {
                                    functionObject = function (callback) {
                                        var optionsget,
                                            reqGet;

                                        optionsget = {
                                            host: host, // here only the domain name (no http/https !)
                                            port: 8090,
                                            path: '/invoices/correlative/' + user.terminal + '?codTipoComprob=' + voucher + '&nroPtoVenta=' + data,
                                            method: 'GET',
                                            headers: {token: user.token.token}
                                        };

                                        reqGet = http.request(optionsget, function (res) {
                                            var resData = '';
                                            res.on('data', function (d) {
                                                resData += d;
                                            });

                                            res.on('end', function () {
                                                var result = JSON.parse(resData),
                                                    totalCnt,
                                                    mailer,
                                                    subject,
                                                    to;

                                                if (result.status === 'OK') {
                                                    totalCnt = result.totalCount;
                                                    result = Enumerable.from(result.data).where(function (item) {
                                                        var response = false;
                                                        if (item.totalCount > 0) {
                                                            response = true;
                                                        }
                                                        return response;
                                                    }).toArray();
                                                    console.log('%s, %s', user.terminal, JSON.stringify(result));

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
                                                            to = ["dreyes@puertobuenosaires.gob.ar", "reclamo.uct@puertobuenosaires.gob.ar", user.email];
                                                            subject = voucherList[voucher.toString()] + " faltantes al " + date + " : " + totalCnt.toString();
                                                            mailer.send(to,
                                                                subject,
                                                                html,
                                                                function (err, dataMail) {
                                                                    if (err) {
                                                                        console.log('No se envió mail. %s', err.data);
                                                                    } else {
                                                                        console.log(user.email);
                                                                        console.log('Se envió mail a %s - %s', to, moment());
                                                                    }
                                                                    return callback();
                                                                });
                                                        });
                                                    } else {
                                                        return callback();
                                                    }
                                                } else {
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
                                callbackTerminal();
                            }
                        });

                    } else {
                        callbackTerminal();
                    }
                });
            }

        }, function () {
            console.log('--------%s--------', moment().format("DD-MM-YYYY"));
            async.parallel(asyncParallel, function () {
                process.exit();
            });
        });


    });

});
