/**
 * Created by diego on 9/5/14.
 */

module.exports = function (app, io, log) {

	var Account = require('../models/account.js');
	var Invoice = require('../models/invoice.js');
	var Comment = require('../models/comment.js');

	function isValidToken (req, res, next){
		var incomingToken = req.headers.token;
		var paramTerminal = req.params.terminal;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				log.logger.error(err);
				res.send(500, {status:'ERROR', data: err});
			} else {

				if (paramTerminal !== undefined && usr.terminal !== 'AGP' && usr.terminal !== paramTerminal) {
					var errMsg = util.format('%s - Error: %s', dateTime.getDatetime(), 'La terminal recibida por parámetro es inválida para el token.');
					log.logger.error(errMsg);
					res.send(500, {status:"ERROR", data: errMsg});
				} else {
					req.usr = usr;
					next();
				}
			}
		});
	}

	function getComments(req, res) {
		'use strict';
		var usr = req.usr;

		Invoice.find({_id: req.params._id}, function (err, invoices){
			if (!err){
				if (invoices.length > 0 && ( invoices[0].terminal === usr.terminal || usr.terminal === 'AGP')){
					var comment = Comment.find({invoice : req.params._id});
					comment.sort({_id: -1})
					comment.exec(function(err, comments){
						if (err) {
							log.logger.error("Error: %s", err.error);
							res.send({status:'ERROR', data: err});
						} else {
							res.send(200, {status:"OK", data: comments||null})
						}
					});
				} else {
					res.send(200, {status:"OK", data: null})
				}
			} else {
				log.logger.error("Error: %s", err.message);
				res.send(500 , {status: "ERROR", data: err.message});
			}
		});

	}

	function addComment (req, res) {
		'use strict';

		var usr = req.usr;
		req.body.user = usr.user;
		req.body.group = usr.group;
		Comment.create(req.body, function (err, commentInserted) {
			if (err){
				log.logger.error("Error Comment INS: %s - %s", err.message, usr.user);
				res.send(500, {status:"ERROR", data: err.message});
			} else {

				Invoice.findOne({_id: req.body.invoice}, function (err, invoice) {
					invoice.comment.push(commentInserted._id);
					invoice.save(function (err){
						if (err){
							log.logger.error("Error Invoice UPD Adding Comment : %s", err.message);
							res.send(500, {status:"ERROR", data: err.message});
						} else {
							res.send(200, {status: 'OK', data: commentInserted});
						}
					});
				});
			}
		});
	}

	app.get('/invoice/:_id/comments', isValidToken, getComments);
	app.post('/comment', isValidToken, addComment);
};

