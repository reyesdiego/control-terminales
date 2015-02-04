'use strict';

/**
 * @module Accounts
 */

module.exports = function (app, passport, log) {
	var self = this;
	var path = require('path');
	var config = require(path.join(__dirname, '..', '/config/config.js'));
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var flash = require(path.join(__dirname, '..', '/include/utils')).flash;
	var dateTime = require('../include/moment');
	var util = require('util');
	var mail = require("../include/emailjs");

	/**
	 * Post method to register a new user
	 *
	 * @param {Object} req the request object
	 * @param {Object} res the response object
	 */
	app.post('/agp/register', function(req, res) {

		var name = req.body.full_name;
		var email = req.body.email;
		var password = req.body.password;
		var terminal = req.body.terminal;

		var user = new Account(
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
		);
		var message;
//TODO tengo que incluir /token -> createToken aqui en register y mandar un mail con el token y un link de activacion
		/*Passport method injection*/
		Account.register(user, password, function(error, account) {
			if (error) {
				if (error.name === 'BadRequestError' && error.message && error.message.indexOf('exists') > -1) {
					message = flash("ERROR", 'El email ya existe.');
				}
				else if (error.name === 'BadRequestError' && error.message && error.message.indexOf('argument not set')) {
					message =  flash ("ERROR", 'It looks like you\'re missing a required argument. Try again.');
				}
				else {
					message = flash("ERROR", 'Ha ocurrido un error en la llamada.');
				}

				res.send(500, message);
			} else {
				//Successfully registered user
				var mailer = new mail.mail(config.email);

				res.render('registerUser.jade', {salt: user.salt, full_name: user.full_name, user: user.user, password: user.password}, function(err, html) {
					var html = {
						data : html,
						alternative: true
					};
					mailer.send(user.email, "Solicitud de registro", html, function(messageBack){
						log.logger.insert('Account INS: %s, se envió mail a %s', user.email, JSON.stringify(messageBack));
					});
					message = flash('OK', account);
					res.send(200, message);
				});

			}
		});
	});

	app.get('/agp/accounts', function (req, res){
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(403, {status:'ERROR', data: err});
			} else {
				if (usr.terminal === 'AGP' && usr.group === 'ADMIN'){
					var project = {
						firstname : true,
						lastname : true,
						full_name: true,
						email: true,
						password: true,
						user: true,
						role: true,
						group: true,
						terminal: true,
						status: true,
						'token.date_created': true
					};

					Account.findAll({}, project, function (err, data){
						if (err){
							res.send(500, {status:"ERROR", data: err.message});
						} else {
							res.send(200, {status:'OK', data: data});
						}
					});
				} else {
					res.send(403, {status:"ERROR", data: "No posee permisos para requerir estos datos"});
				}
			}
		})
	});

	app.put('/agp/account/:id/enable', function (req, res) {
		var message = '';
		enableAccount(req, res, true, function (user){
			res.render('enableUser.jade', {full_name: user.full_name, user: user.user, password: user.password}, function(err, html) {
				var html = {
					data : html,
					alternative: true
				};
				var mailer = new mail.mail(config.email);
				mailer.send(user.email, "Usuario aprobado", html, function(messageBack){
					log.logger.update('Account ENABLE: %s, se envió mail a %s', user.email, JSON.stringify(messageBack));
					message = flash('OK', user);
					res.send(200, message);
				});
			});
		});
	});

	app.put('/agp/account/:id/disable', function (req, res){
		enableAccount(req, res, false, function (user){
			res.send(200, {status:'OK', data: user});
		});
	});


	/**
	 * Login method
	 *
	 * @param {Object} req the request object
	 * @param {Object} res the response object
	 */
	app.post('/login', function(req, res) {

		var json = req.body;
		var errMsg='';

		if (json.email !== undefined) {
			Account.login(json.email, json.password, function(err, usersToken) {

				if (err) {
//					if (req.socket.remoteAddress !== '127.0.0.1' && req.socket.remoteAddress !== 'localhost'){
//						var ActiveDirectory = require('activedirectory');
//						var ad = new ActiveDirectory(	{	url: 'ldap://10.0.0.56:389',
//															baseDN: 'dc=ptobaires,dc=gov,dc=ar'
//														});
//						var user = util.format('%s@ptobaires.gov.ar', json.email);
//						ad.authenticate(user, json.password, function(err, auth) {
//
//							if (auth) {
//								Account.findOne({user:"agp"}, function (err, userAgp){
//									var msg = util.format("%s - User '%s' has logged in From: %s", dateTime.getDatetime(), json.email, req.socket.remoteAddress);
//									console.log(msg);
//									//TODO
//									//Por ahora solo acceso a terminales
//									var rutasAcceso = ['matches.search','tarifario', 'invoices', 'invoices.result', 'invoices.search', 'matches', 'control', 'cfacturas', 'cfacturas.result', 'gates', 'gates.invoices', 'gates.invoices.result', 'gates.result.container', 'turnos', 'turnos.result'];
//
//									var result = {
//										acceso: rutasAcceso,
//										role: userAgp.role,
//										email: json.email,
//										user: json.email,
//										terminal: userAgp.terminal,
//										token: userAgp.token,
//										date_created: userAgp.date_created,
//										full_name: userAgp.full_name
//									};
//									res.send(200, result);
//								});
//							}
//							else {
//								if (err) {
//									var errMsg = util.format("%s - ERROR: Authentication Failed -  %s. From: %s", dateTime.getDatetime(), JSON.stringify(err), req.socket.remoteAddress);
//									console.error(errMsg);
//									res.send(403, errMsg);
//									return;
//								}
//								var errMsg = util.format("%s - ERROR: Authentication Failed - %s. From: %s", dateTime.getDatetime(), err.error, req.socket.remoteAddress);
//								console.error(errMsg);
//								res.send(403, errMsg);
//							}
//						});
//					} else {
//						var errMsg = util.format("%s - ERROR: Authentication Failed - %s. From: %s", dateTime.getDatetime(), err.error, req.socket.remoteAddress);
//						console.error(errMsg);
//						res.send(403, errMsg);
//					}
					errMsg = err.message;
					log.logger.error(errMsg);
					res.send(403, {status:"ERROR", data: errMsg});

				} else {
					if (usersToken.status){
						log.logger.info("User '%s' has logged in From: %s", json.email, req.socket.remoteAddress);
						res.send(200, {status:"OK", data: usersToken});
					} else {
						errMsg = util.format("El usuario %s no se encuentra habilitado para utilizar el sistema. Debe contactar al administrador.", usersToken.email);
						res.send(403, {status:"ERROR", data: errMsg});
					}
				}
			});
		} else {
			errMsg = util.format("Debe proveerse un usuario o email");
			log.logger.error(errMsg);
			res.send(403, {status:"ERROR", data: errMsg});
		}
	});

	app.post('/agp/password', function (req, res) {
		if (req.body.email !== undefined) {
			Account.password(req.body.email, req.body.password, req.body.newPass, function(err, result) {

				if (err) {
					log.logger.error("El password de %s ha producido un error: %s.", req.body.email, err.message);
					res.send(500, {status:"ERROR", data: err.message});
				} else {
					log.logger.info("El password de %s ha cambiado satisfactoriamente.", req.body.email);
					res.send(200, {status:"OK", data: result});
				}
			});
		} else {
			res.send({error: 'AuthError'});
		}
	});

//	app.post('/token/', passport.authenticate('local', {session: false}), function(req, res) {
	app.get('/agp/token', function(req, res) {

		if (req.query.salt !== undefined){
			Account.findAll({salt: req.query.salt}, function (err, data){
				var user = data[0];
				Account.createUserToken(user.email, function(err, html) {
					if (err) {
						res.send(500, {status: "ERROR", data: 'Hubo un problema al generar el token'});
					} else {
						res.render('tokenUser.jade', {full_name: user.full_name, user: user.user, password: user.password}, function(err, html) {
							var mailer = new mail.mail(config.email);
							var htmlMail = {
								data : "<html><body><p>El usuario "+user.user+" ha solicitado ingreso al sistema.</p></body></html>",
								alternative: true
							};
							mailer.send("dreyes@puertobuenosaires.gob.ar", "Nuevo usuario para IIT", htmlMail, function(messageBack){
							});
							res.send(200, html);
						});

					}
				});
			});
		}

	});

	app.get('/apitest', function(req, res) {
		var incomingToken = req.headers.token;
		console.log('incomingToken: ' + incomingToken);
		var decoded = Account.decode(incomingToken);
		//Now do a lookup on that email in mongodb ... if exists it's a real user
		if (decoded && decoded.email) {
			Account.findUser(decoded.email, incomingToken, function(err, user) {
				if (err) {
					console.log(err);
					res.json({error: 'Issue finding user.'});
				} else {
					res.json({
						user: {
							email: user.email,
							full_name: user.full_name,
							token: user.token.token
						}
					});
				}
			});
		} else {
			console.log('Whoa! Couldn\'t even decode incoming token!');
			res.json({error: 'Issue decoding incoming token.'});
		}
	});

	app.get('/logout', function(req, res) {
		req.logout();
	});

	app.post('/agp/resetPassword/:email', function (req, res){

		if (req.params.email != null && req.params.email !== ''){
			Account.findUserByEmailOnly(req.params.email, function (err, user) {
				var message='';
				if (err) {
					var msg = util.format('Ha ocurrido un error al intentar resetar el password: %s', err.message);
					message = flash("ERROR", msg);
					res.send(500, message);
				} else {

					if (user != null){

						var newPass = '';
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
								data : "<html><body><p>Ud. a solicitado el cambio de Clave en la página de Control de Información de Terminales portuarias.</p><p>El nuevo password temporal es: <span color=blue><b>"+newPass+"</b></span></p></body></html>",
								alternative: true
							};
							mailer.send(user.email, "Cambio de Clave", html, function(messageBack){
								log.logger.update('Account UPD: %s, se envío el cambio de clave correctamente.', user.email);
							});
							var result = {email: userUpd.email, full_name: userUpd.full_name, terminal: userUpd.terminal}
							var message = flash('OK', result);
							res.send(200, message);
						});
					} else {
						var msg = util.format('La cuenta de correo %s no ha sido registrada.', req.params.email);
						message = flash("ERROR", msg);
						res.send(500, message);
					}

				}
			});
		}
	});

	app.get('/reset/:id', function(req, res) {
		console.log('GOT IN /reset/:id...');
		var token = req.params.id,
			messages = flash(null, null);

		if (!token) {
			console.log('Issue getting reset :id');
			//TODO: Error response...
		}
		else {
			console.log('In ELSE ... good to go.');
			//TODO
			//
			//1. find user with reset_token == token .. no match THEN error
			//2. check now.getTime() < reset_link_expires_millis
			//3. if not expired, present reset password page/form
			res.render('resetpass', messages);
		}
	});


	function enableAccount(req, res, enable, callback) {
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(usr);
				res.send(403, {status:'ERROR', data: err});
			} else {
				if (usr.terminal === 'AGP' && usr.group === 'ADMIN'){
					Account.findOne({_id: req.params.id}, function (err, user){
						if (err){

						}else{
							user.status = enable;
							user.save(function (err, userUpd, rowsAffected){
								var desc = (enable) ? "Habilitada" : "Deshabilitada";
								log.logger.update('Account UPD: La cuenta ha sido %s correctamente. %s', desc, userUpd.email);
								callback(userUpd);
							});
						}
					});
				}
			}
		});
	}

};
