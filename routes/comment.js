/**
 * Created by diego on 9/5/14.
 */

module.exports = function (log, oracle) {
    'use strict';
    var express = require('express'),
        router = express.Router(),
        Invoice = require('../models/invoice.js'),
        Comment = require('../models/comment.js');

    function getComments(req, res) {
        var Comment = require('../lib/comment.js');
        var param = {
            terminal: req.usr.terminal,
            invoice: req.params.invoice
        }

        Comment = new Comment(oracle);
        Comment.getComments(param)
        .then((data) => {
                res.status(200).send(data);
            })
        .catch((err) => {
                log.logger.error("Error: %s", err.error);
                res.status(500).send(err);
            });

    }

    function addComment(req, res) {

        var usr = req.usr;
        req.body.user = usr.user;
        req.body.group = usr.group;
        Comment.create(req.body, function (err, commentInserted) {
            if (err) {
                log.logger.error("Error Comment INS: %s - %s", err.message, usr.user);
                res.status(500).send({status: "ERROR", data: err.message});
            } else {
                Invoice.findOne({_id: req.body.invoice}, function (err, invoice) {
                    invoice.comment.push(commentInserted._id);
                    invoice.save(function (err) {
                        if (err) {
                            log.logger.error("Error Invoice UPD Adding Comment : %s", err.message);
                            res.status(500).send({status: "ERROR", data: err.message});
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
};

