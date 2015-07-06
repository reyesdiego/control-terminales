/**
 * @module Accounts
 */

module.exports = function (log, app, passport) {
    'use strict';

    var path = require('path'),
        config = require(path.join(__dirname, '..', '/config/config.js')),
        Account = require(path.join(__dirname, '..', '/models/account')),
        flash = require(path.join(__dirname, '..', '/include/utils')).flash,
        util = require('util'),
        mail = require("../include/emailjs");

    function enableAccount(req, res, enable, callback) {
        var incomingToken = req.headers.token;
        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(usr);
                res.status(403).json({status: 'ERROR', data: err});
            } else {
                if (usr.terminal === 'AGP' && usr.group === 'ADMIN') {
                    Account.findOne({_id: req.params.id}, function (err, user) {
                        if (err) {
                            return callback(err);
                        } else {
                            user.status = enable;
                            user.save(function (err, userUpd) {
                                if (err !== null) {
                                    log.logger.error("Error en Enable/Disable Account %s", err.message);
                                    res.status(500).json({status: 'ERROR', data: err.message});
                                } else {
                                    if (typeof callback === 'function') {
                                        return callback(userUpd);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    /**
     * Post method to register a new user
     *
     * @param {Object} req the request object
     * @param {Object} res the response object
     */
    app.post('/agp/register', function (req, res) {

        var name = req.body.full_name,
            email = req.body.email,
            password = req.body.password,
            terminal = req.body.terminal,
            user = new Account(
                {
                    firstname : req.body.firstname,
                    lastname : req.body.lastname,
                    full_name: name,
                    email: email,
                    password: req.body.password,
                    user: req.body.user,
                    role: req.body.role,
                    terminal: terminal,
                    status: false
                }
            ),
            message;

        /*Passport method injection*/
        Account.register(user, password, function (error, account) {
            var mailer,
                emailConfig;

            if (error) {
                if (error.name === 'BadRequestError' && error.message && error.message.indexOf('exists') > -1) {
                    message = flash("ERROR", 'El email ya existe.');
                } else if (error.name === 'BadRequestError' && error.message && error.message.indexOf('argument not set')) {
                    message =  flash("ERROR", 'It looks like you\'re missing a required argument. Try again.');
                } else if (error.name === 'MongoError' && error.message.indexOf('duplicate')) {
                    message = flash("ERROR", 'El usuario ya existe.');
                } else {
                    message = flash("ERROR", 'Ha ocurrido un error en la llamada.');
                }
                res.status(500).send(message);
            } else {
                //Successfully registered user

                delete account.password;

                emailConfig = Object.create(config.email);
                emailConfig.throughBcc = false;
                mailer = new mail.mail(emailConfig);

                res.render('registerUser.jade', {url: config.url, salt: user.salt, full_name: user.full_name, user: user.user, password: user.password}, function (errJade, html) {
                    html = {
                        data : html,
                        alternative: true
                    };
                    mailer.send(user.email, "Solicitud de registro", html, function (errMail, messageBack) {
                        var result = {
                            status: "OK",
                            data: account,
                            emailDelivered: false
                        };
                        if (errMail) {
                            log.logger.error('Account INS: %s, NO se envió mail a %s', user.user, user.email);
                        } else {
                            log.logger.insert('Account INS: %s, se envió mail a %s', user.user, user.email);
                            result.emailDelivered = true;
                        }
                        res.status(200).send(result);
                    });
                });
            }
        });
    });

    app.get('/agp/accounts', function (req, res) {
        var incomingToken = req.headers.token,
            project;
        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(err);
                res.status(403).json({status: 'ERROR', data: err});
            } else {
                if (usr.terminal === 'AGP' && usr.group === 'ADMIN') {
                    project = {
                        firstname : true,
                        lastname : true,
                        full_name: true,
                        email: true,
                        //password: false,
                        user: true,
                        role: true,
                        group: true,
                        terminal: true,
                        status: true,
                        date_created: true,
                        'token.date_created': true,
                        lastLogin : true,
                        acceso: true,
                        emailToApp: true
                    };

                    Account.findAll({}, project, function (err, data) {
                        if (err) {
                            res.status(500).json({status: "ERROR", data: err.message});
                        } else {
                            res.status(200).json({status: 'OK', data: data});
                        }
                    });
                } else {
                    res.status(403).json({status: "ERROR", data: "No posee permisos para requerir estos datos"});
                }
            }
        });
    });

    app.put('/agp/account/:id/enable', function (req, res) {
        var message = '',
            mailer,
            emailConfig;

        enableAccount(req, res, true, function (user) {
            var sendMail = config.email;

            message = flash('OK', user);

            if (sendMail) {
                res.render('enableUser.jade', {full_name: user.full_name, user: user.user, password: user.password}, function (err, html) {
                    html = {
                        data : html,
                        alternative: true
                    };
                    emailConfig = Object.create(config.email);
                    emailConfig.throughBcc = false;
                    mailer = new mail.mail(emailConfig);

                    mailer.send(user.email, "Usuario aprobado", html, function (err, messageBack) {
                        log.logger.update('Account ENABLE: %s, se envió mail a %s', user.user, user.email);
                        res.status(200).send(message);
                    });
                });
            } else {
                log.logger.update('Account ENABLE: %s', user.email);
                res.status(200).send(message);
            }
        });
    });

    app.put('/agp/account/:id/disable', function (req, res) {
        enableAccount(req, res, false, function (user) {
            log.logger.update('Account DISABLED: %s', user.email);
            res.status(200).json({status: 'OK', data: user});
        });
    });

    app.put('/agp/account/:id/tasks', function (req, res) {
        var incomingToken = req.headers.token;
        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(usr);
                res.status(403).json({status: 'ERROR', data: err});
            } else {
                if (usr.terminal.toUpperCase() === 'AGP' && usr.group.toUpperCase() === 'ADMIN') {
                    Account.findOne({_id: req.params.id}, function (err, user) {
                        if (err) {
                            res.status(403).json({status: 'ERROR', data: err.message});
                        } else {
                            user.acceso = req.body.acceso;
                            user.save(function (err, userUpd) {
                                if (err !== null) {
                                    log.logger.error("Error en seteo de tareas para la cuenta. %s", err.message);
                                    res.status(500).json({status: 'ERROR', data: err.message});
                                } else {
                                    res.status(200).json({status: 'OK', data: userUpd});
                                }
                            });
                        }
                    });
                }
            }
        });
    });

    app.put('/agp/account/:id/emailToApp', function (req, res) {
        var incomingToken = req.headers.token;
        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(usr);
                res.status(403).json({status: 'ERROR', data: err});
            } else {
                if (usr.terminal.toUpperCase() === 'AGP' && usr.group.toUpperCase() === 'ADMIN') {
                    Account.findOne({_id: req.params.id}, function (err, user) {
                        if (err) {
                            res.status(403).json({status: 'ERROR', data: err.message});
                        } else {
                            user.emailToApp = req.body.emailToApp;
                            user.save(function (err, userUpd) {
                                if (err !== null) {
                                    log.logger.error("Error en seteo de las notificaciones de la cuenta. %s", err.message);
                                    res.status(500).json({status: 'ERROR', data: err.message});
                                } else {
                                    res.status(200).json({status: 'OK', data: userUpd});
                                }
                            });
                        }
                    });
                }
            }
        });
    });

    app.get('/agp/account/token', function (req, res) {

        var result,
            emailConfig,
            mailer;

        Account.findAll({salt: req.query.salt}, function (err, users) {
            if (err) {
                res.status(500).send({status: "ERROR", data: err});
            } else {
                if (users[0].status) {
                    result = {
                        status: "ERROR",
                        message: "El usuario ya se encuentra habilitado.",
                        data: "El usuario ya se encuentra habilitado."
                    };
                    res.status(500).send(result);
                } else {

                    emailConfig = Object.create(config.email);
                    emailConfig.throughBcc = false;
                    mailer = new mail.mail(emailConfig);

                    var user = users[0];
                    res.render('registerUser.jade', {
                        url: config.url,
                        salt: user.salt,
                        full_name: user.full_name,
                        user: user.user,
                        password: user.password
                    }, function (errJade, html) {
                        html = {
                            data: html,
                            alternative: true
                        };
                        mailer.send(user.email, "Solicitud de registro", html, function (errMail, messageBack) {
                            var result = {
                                status: "OK",
                                data: user,
                                emailDelivered: false
                            };
                            if (errMail) {
                                log.logger.error('Account Register by Page: %s, NO se envió mail a %s', user.user, user.email);
                            } else {
                                log.logger.insert('Account Register by Page: %s, se envió mail a %s', user.user, user.email);
                                result.emailDelivered = true;
                            }
                            res.status(200).send(result);
                        });
                    });
                }
            }
        });

    });

    /**
     * Login method
     *
     * @param {Object} req the request object
     * @param {Object} res the response object
     */
    app.post('/login', function (req, res) {

        var json = req.body,
            errMsg = '';

        if (json.email !== undefined) {
            Account.login(json.email, json.password, function (err, usersToken) {
                if (err) {

//                        if (req.socket.remoteAddress !== '127.0.0.1' && req.socket.remoteAddress !== 'localhost'){
//                            var ActiveDirectory = require('activedirectory');
//                            var ad = new ActiveDirectory({url: 'ldap://10.0.0.56:389',
//                                                                baseDN: 'dc=ptobaires,dc=gov,dc=ar'
//                                                            });
//                            var user = util.format('%s@ptobaires.gov.ar', json.email);
//                            ad.authenticate(user, json.password, function(err, auth) {

//                                if (auth) {
//                                    Account.findOne({user:"agp"}, function (err, userAgp){
//                                        var msg = util.format("%s - User '%s' has logged in From: %s", dateTime.getDatetime(), json.email, req.socket.remoteAddress);
//                                        console.log(msg);

//                                        //Por ahora solo acceso a terminales
//                                        var rutasAcceso = ['matches.search','tarifario', 'invoices', 'invoices.result', 'invoices.search', 'matches', 'control', 'cfacturas', 'cfacturas.result', 'gates', 'gates.invoices', 'gates.invoices.result', 'gates.result.container', 'turnos', 'turnos.result'];
//
//                                        var result = {
//                                            acceso: rutasAcceso,
//                                            role: userAgp.role,
//                                            email: json.email,
//                                            user: json.email,
//                                            terminal: userAgp.terminal,
//                                            token: userAgp.token,
//                                            date_created: userAgp.date_created,
//                                            full_name: userAgp.full_name
//                                        };
//                                        res.send(200, result);
//                                    });
//                                }
//                                else {
//                                    if (err) {
//                                        var errMsg = util.format("%s - ERROR: Authentication Failed -  %s. From: %s", dateTime.getDatetime(), JSON.stringify(err), req.socket.remoteAddress);
//                                        console.error(errMsg);
//                                        res.send(403, errMsg);
//                                        return;
//                                    }
//                                    var errMsg = util.format("%s - ERROR: Authentication Failed - %s. From: %s", dateTime.getDatetime(), err.error, req.socket.remoteAddress);
//                                    console.error(errMsg);
//                                    res.send(403, errMsg);
//                                }
//                            });
//                        } else {
//                            var errMsg = util.format("%s - ERROR: Authentication Failed - %s. From: %s", dateTime.getDatetime(), err.error, req.socket.remoteAddress);
//                            console.error(errMsg);
//                            res.send(403, errMsg);
//                        }

                    errMsg = err.message;
                    log.logger.error(errMsg);
                    res.status(403).json({status: "ERROR", code: err.code, message: err.message, data: err.data});

                } else {
                    if (usersToken.status) {
                        Account.findOne({_id: usersToken._id}, function (err, loggedUser) {
                            loggedUser.lastLogin = new Date();
                            loggedUser.save(function (err, userSaved) {
                                log.logger.info("User '%s' has logged in From: %s", json.email, req.socket.remoteAddress);
                                res.status(200).json({
                                    status: "OK",
                                    data: usersToken
                                });
                            });
                        });
                    } else {
                        errMsg = util.format("El usuario %s no se encuentra habilitado para utilizar el sistema. Debe contactar al administrador.", usersToken.email);
                        res.status(403).json({
                            status: "ERROR",
                            code: "ACC-0004",
                            message: errMsg,
                            data: errMsg
                        });
                    }
                }
            });
        } else {
            errMsg = util.format("Debe proveerse un usuario o email");
            log.logger.error(errMsg);
            res.status(400).json({status: "ERROR", data: errMsg});
        }
    });

    app.post('/agp/password', function (req, res) {
        if (req.body.email !== undefined) {
            Account.password(req.body.email, req.body.password, req.body.newPass, function (err, result) {

                if (err) {
                    log.logger.error("El password de %s ha producido un error: %s.", req.body.email, err.message);
                    res.status(500).json({status: "ERROR", data: err.message});
                } else {
                    log.logger.info("El password de %s ha cambiado satisfactoriamente.", req.body.email);
                    res.status(200).json({status: "OK", data: result});
                }
            });
        } else {
            res.status(200).json({error: 'AuthError'});
        }
    });

    //app.post('/token/', passport.authenticate('local', {session: false}), function(req, res) {
    app.get('/agp/token', function (req, res) {

        if (req.query.salt !== undefined) {
            Account.findAll({salt: req.query.salt}, function (err, data) {
                var user = data[0];
                Account.createUserToken(user.email, function (err, html) {
                    if (err) {
                        res.status(500).json({status: "ERROR", data: 'Hubo un problema al generar el token'});
                    } else {
                        res.render('tokenUser.jade', {full_name: user.full_name, user: user.user, password: user.password}, function(err, html) {
                            var mailer = new mail.mail(config.email),
                                htmlMail = {
                                    data : "<html><body><p>El usuario " + user.user + " ha solicitado ingreso al sistema.</p></body></html>",
                                    alternative: true
                                };
                            mailer.send("dreyes@puertobuenosaires.gob.ar", "Nuevo usuario para IIT", htmlMail, function () {
                            });
                            res.status(200).send(html);
                        });

                    }
                });
            });
        }

    });

    app.get('/logout', function (req, res) {
        req.logout();
    });

    app.post('/agp/resetPassword/:email', function (req, res) {

        if (req.params.email !== null && req.params.email !== '') {
            Account.findUserByEmailOnly(req.params.email, function (err, user) {
                var message = '',
                    msg = '',
                    newPass = '';

                if (err) {
                    msg = util.format('Ha ocurrido un error al intentar resetar el password: %s', err.message);
                    message = flash("ERROR", msg);
                    res.status(500).json(message);
                } else {

                    if (user !== null) {

                        //genero random de 8 letras
                        for (var i=0; i<9; i++){
                            var ascii = Math.random();
                            ascii = ascii * (90 - 65) + 65;
                            ascii = parseInt(ascii, 10);
                            if (Math.random() < .5)
                                newPass += String.fromCharCode(ascii).toLowerCase();
                            else
                                newPass += String.fromCharCode(ascii);
                        }

                        user.password = newPass;
                        user.save (function (err, userUpd, rowAffected){
                            var mailer = new mail.mail(config.email);
                            var html = {
                                    data : "<html><body><p>Ud. a solicitado el cambio de Clave en la página de Control de Información de Terminales portuarias.</p><p>El nuevo password temporal es: <span color=blue><b>" + newPass + "</b></span></p></body></html>",
                                    alternative: true
                                };
                            mailer.send(user.email, "Cambio de Clave", html, function(){
                                log.logger.update('Account UPD: %s, se envío el cambio de clave correctamente.', user.email);
                            });
                            var result = {email: userUpd.email, full_name: userUpd.full_name, terminal: userUpd.terminal};
                            var message = flash('OK', result);
                            res.status(200).send(message);
                        });
                    } else {
                        msg = util.format('La cuenta de correo %s no ha sido registrada.', req.params.email);
                        message = flash("ERROR", msg);
                        res.status(500).json(message);
                    }

                }
            });
        }
    });

    app.get('/reset/:id', function (req, res) {
        console.log('GOT IN /reset/:id...');
        var token = req.params.id,
            messages = flash(null, null);

        if (!token) {
            console.log('Issue getting reset :id');
        }
        else {
            console.log('In ELSE ... good to go.');
            //TODO

            //1. find user with reset_token == token .. no match THEN error
            //2. check now.getTime() < reset_link_expires_millis
            //3. if not expired, present reset password page/form
            res.render('resetpass', messages);
        }
    });

};
