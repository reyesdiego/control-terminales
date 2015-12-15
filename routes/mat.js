/**
 * Created by diego on 12/9/15.
 */

module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router();

    function getMats(req, res) {
        var Mat = require('../models/mat.js'),
            response;

        Mat.find({}, function (err, data) {
            if (err) {
                res.status(500).send({status: "ERROR", data: err.message});
            } else {
                response = {
                    status: 'OK',
                    totalCount: data.length,
                    data: data
                };
                res.status(200).send(response);
            }
        });
    }

    function createMat(req, res) {

        var Mat = require('../models/mat.js'),
            mat = req.body,
            moment = require('moment'),
            i,
            rate,
            matNew,
            date;

        rate = mat.mat / 12;
        matNew = {
            terminal: mat.terminal,
            year: mat.year,
            mat: mat.mat,
            months: []
        };

        for (i = 0; i < 12; i++) {
            date = moment([mat.year, i]);
            matNew.months.push({
                month: date.month(i).format("MMMM"),
                date: date.format("YYYY-MM-DDTHH:mm:ss.sssZ"),
                mat: rate
            });
        }

        Mat.create(matNew, function(err, data) {
            if (err) {
                log.logger.error("%s", err.message);
                res.status(500).send({status: "ERROR", message: err.message});
            } else {
                res.status(200).send({status: "OK", data: data});
            }
        });
    }

    function updateMat(req, res) {

        var Mat = require('../models/mat.js'),
            mat = req.body,
            moment = require('moment'),
            i,
            rate,
            matUpd;

        rate = mat.mat / 12;
        matUpd = {
            terminal: mat.terminal,
            year: mat.year
        };

        Mat.findOne(matUpd, function(err, data) {
            if (err) {
                log.logger.error("%s", err.message);
                res.status(500).send({status: "ERROR", message: err.message});
            } else {
                data.mat = mat.mat;
                for (i = 0; i < 12; i++) {
                    data.months[i].mat = rate;
                }
                data.save(function (err, rowAffected) {
                    res.status(200).send({status: "OK", data: data});
                })
            }
        });
    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.get('/', getMats);
    router.post('/mat', createMat);
    router.put('/mat', updateMat);

    return router;
}