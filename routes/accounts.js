'use strict';

var path = require('path');
var config = require(path.join(__dirname, '..', '/config/config.js'));
var Account = require(path.join(__dirname, '..', '/models/account'));
var flash = require(path.join(__dirname, '..', '/include/utils')).flash;

/**
 * @module Accounts
 */

module.exports = function (app, passport) {

	/**
	 * Default route for app, currently displays signup form.
	 *
	 * @param {Object} req the request object
	 * @param {Object} res the response object
	 */
	app.get('/', function (req, res) {
		res.render('register', {info: null, err: null});
	});

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
		var user = new Account({full_name: name,email: email, terminal: terminal});
		var message;
//TODO tengo que incluir /token -> createToken aqui en register y mandar un mail con el token y un link de activacion
		/*Passport method injection*/
		Account.register(user, password, function(error, account) {
			if (error) {
				if (error.name === 'BadRequesterroror' && error.message && error.message.indexOf('exists') > -1) {
					message = flash(null, 'Sorry. That email already exists. Try again.');
				}
				else if (error.name === 'BadRequesterroror' && error.message && error.message.indexOf('argument not set')) {
					message =  flash (null, 'It looks like you\'re missing a required argument. Try again.');
				}
				else {
					message = flash(null, 'Sorry. There was an error processing your request. Please try again or contact technical support.');
				}

//				res.render('register', message);
			} else {
				//Successfully registered user
				res.send(account);
			}
		});
	});

	/**
	 * Login method
	 *
	 * @param {Object} req the request object
	 * @param {Object} res the response object
	 */
	app.post('/login', function(req, res) {

		var postData="";
		req.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
		});
		req.addListener("end", function() {
			console.log(postData);
			var json = JSON.parse(postData);
			console.log(json);
			if (json.email !== undefined) {
				Account.login(json.email, json.password, function(err, usersToken) {

					if (err) {
						res.send(403, err.error);
					} else {
						res.send(usersToken);
					}
				});
			} else {
//			res.send(403);
			}

		})

	});

	app.put('/agp/password', function (req, res) {
		console.log(req.body);
		if (req.body.email !== undefined) {
			Account.password(req.body.email, req.body.password, req.body.newPass, function(err, result) {

				if (err) {
					res.send(err);
				} else {
					res.send(result);
				}
			});
		} else {
			res.send({error: 'AuthError'});
		}
	});

//	app.post('/token/', passport.authenticate('local', {session: false}), function(req, res) {
	app.post('/token/', function(req, res) {
		if (req.user) {
			Account.createUserToken(req.user.email, function(err, usersToken) {
				// console.log('token generated: ' +usersToken);
				// console.log(err);
				if (err) {
					res.json({error: 'Issue generating token'});
				} else {
					res.json({token : usersToken});
				}
			});
		} else {
			res.json({error: 'AuthError'});
		}
	});

	app.get('/apitest/', function(req, res) {
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

	app.get('/forgot', function(req, res) {
		res.render('forgot');
	});

	app.post('/forgot', function(req, res) {

		Account.generateResetToken(req.body.email, function(err, user) {
			if (err) {
				res.json({error: 'Issue finding user.'});
			} else {
				var token = user.reset_token;
				var resetLink = 'http://localhost:1337/reset/'+ token;

				//TODO: This is all temporary hackish. When we have email configured
				//properly, all this will be stuffed within that email instead :)
				res.send('<h2>Reset Email (simulation)</h2><br><p>To reset your password click the URL below.</p><br>' +
					'<a href=' + resetLink + '>' + resetLink + '</a><br>' +
					'If you did not request your password to be reset please ignore this email and your password will stay as it is.');
			}
		});
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
};
