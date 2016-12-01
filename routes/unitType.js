/**
 * Created by diego on 11/17/14.
 */

module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        response;

    function getUnitTypes(req, res) {
        var Unit = require('../models/unitType.js');

        Unit.find({})
            .sort({description: 1})
            .exec((err, data) => {
                if (err) {
                    response = {
                        status: "ERROR",
                        message: err.message,
                        data: err
                    };
                    res.status(500).send(response);
                } else {
                    var result = data;
                    if (req.query.type === 'array') {
                        result = {};
                        data.forEach(function (item) {
                            result[item._id] = item.description;
                        });
                    }
                    response = {
                        status: 'OK',
                        totalCount: data.length,
                        data: result
                    };
                    res.status(200).send(response);
                }
            });
    }
/*
router.use(function timeLog(req, res, next){
    log.logger.info('Time: %s', Date.now());
    next();
});
*/
    router.get('/', getUnitTypes);

    return router;
}