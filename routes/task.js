/**
 * Created by diego on 5/13/15.
 */

module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        Task = require('../models/task.js');

    function getTasks(req, res) {

        var tasks = Task.find(),
            result;

        tasks.sort({description: 1});
        tasks.exec(function (err, data) {
            if (err) {
                res.status(500).send({status: 'ERROR', data: err.message});
            } else {
                result = {
                    status: 'OK',
                    data: data
                };
                res.status(200).send(result);
            }
        });
    }

    router.get('/', getTasks);

    return router;
};