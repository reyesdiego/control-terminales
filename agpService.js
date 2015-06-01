/**
 * Created by diego on 8/28/14.
 */

var mongoose = require('mongoose');
var Account = require('./models/account.js');
var http = require('http');
var mail = require('./include/emailjs');
var config = require('./config/config.js');
var async = require("async");
var moment = require('moment');

mongoose.connect(config.mongo_url, config.mongo_opts);
//mongoose.connect(config.mongo_url);

var date = moment().format('DD-MM-YYYY');

var asyncParallel = [];
var terminals = ['bactssa', 't4', 'trp'];
var sendMail = config.email;

terminals.forEach(function (item) {
    'use strict';

    asyncParallel.push(function (callback) {
        var user,
            optionsget,
            reqGet;
        Account.findAll({user: item}, {terminal: 1, token: 1, email: 1}, function (err, accountData) {

            if (err) {
                console.error(err);
            } else {
                if (accountData.length > 0) {
                    user = accountData[0];

                    optionsget = {
                        host : '10.1.0.51', // here only the domain name (no http/https !)
                        port : 8080,
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
                                mailer;

                            if (result.status === 'OK') {
                                console.log('%s, %s', item, result.data);
                                if (result.data.length > 0) {
                                    mailer = new mail.mail(sendMail);
                                    mailer.send( user.email,
                                        result.data.length.toString() + " CÓDIGOS SIN ASOCIAR AL " + date,
                                        user.terminal + '\n\n' + result.data,
                                        function () {
                                            console.log('Se envió mail a %s, con %s', user.email, result.data);
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

                } else {
                    return callback();
                }
            }

        });

    });
});

async.parallel(asyncParallel, function () {
    process.exit(code=0);
});
