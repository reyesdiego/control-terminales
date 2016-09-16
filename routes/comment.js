/**
 * Created by diego on 9/5/14.
 */

module.exports = function (log, oracle) {
    'use strict';
    var express = require('express'),
        router = express.Router(),
        Invoice = require('../models/invoice.js');

    var Comment = require('../lib/comment.js');
    Comment = new Comment(oracle);

    let getComments = (req, res) => {
        var param = {
            terminal: req.usr.terminal,
            invoice: req.params.invoiceId
        }

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

        var param = {
            user: req.usr.user,
            group: req.usr.group,
            title: req.body.title,
            comment: req.body.comment,
            estado: req.body.state,
            invoiceId: req.body.invoice
        }
        var usr = req.usr;

        Comment.add(param)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                log.logger.error("Error Comment INS: %s - %s", err.message, usr.user);
                res.status(500).send(err);
            });
    }

/*
router.use(function timeLog(req, res, next){
    log.logger.info('Time: %s', Date.now());
    next();
});
*/

    router.get('/:invoiceId', getComments);
    router.post('/comment', addComment);

    return router;
};

