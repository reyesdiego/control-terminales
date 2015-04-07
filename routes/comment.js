/**
 * Created by diego on 9/5/14.
 */

module.exports = function (log) {

	var express = require('express');
	var router = express.Router();

	var Invoice = require('../models/invoice.js');
	var Comment = require('../models/comment.js');

	function getComments(req, res) {
		'use strict';
		var usr = req.usr;
		var invoiceQueryParam = req.params.invoice

		Invoice.find({_id: invoiceQueryParam}, function (err, invoices){
			if (!err){
				if (invoices.length > 0 && ( invoices[0].terminal === usr.terminal || usr.terminal === 'AGP')){
					var comment = Comment.find({invoice : invoiceQueryParam});
					comment.sort({_id: -1})
					comment.exec(function(err, comments){
						if (err) {
							log.logger.error("Error: %s", err.error);
							res.status(500).send({status:'ERROR', data: err});
						} else {
							res.status(200).send({status:"OK", data: comments||null});
						}
					});
				} else {
					res.status(200).send({status:"OK", data: null})
				}
			} else {
				log.logger.error("Error: %s", err.message);
				res.status(500).send({status: "ERROR", data: err.message});
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
				res.status(500).send({status:"ERROR", data: err.message});
			} else {

				Invoice.findOne({_id: req.body.invoice}, function (err, invoice) {
					invoice.comment.push(commentInserted._id);
					invoice.save(function (err){
						if (err){
							log.logger.error("Error Invoice UPD Adding Comment : %s", err.message);
							res.status(500).send({status:"ERROR", data: err.message});
						} else {
							res.status(200).send({status: 'OK', data: commentInserted});
						}
					});
				});
			}
		});
	}
/*
	router.use(function timeLog(req, res, next){
		log.logger.info('Time: %s', Date.now());
		next();
	});
*/

	router.get('/:invoice', getComments);
	router.post('/comment', addComment);

	return router;
//	app.get('/invoice/:_id/comments', isValidToken, getComments);
//	app.post('/comment', isValidToken, addComment);
};

