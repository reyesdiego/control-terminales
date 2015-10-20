/**
 * Created by diego on 6/3/14.
 */

module.exports = function (log) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        Voucher = require('../models/voucherType.js');

    function getVoucherTypes(req, res) {
        var response,
            result,
            vouchers;

        vouchers = Voucher.find();
        vouchers.sort({description: 1});
        vouchers.lean();
        vouchers.exec(function (err, data) {
            if (err) {
                res.status(500).send({status: "ERROR", data: err.message});
            } else {
                result = data;
                if (req.query.type === 'array') {
                    result = {};
                    data.forEach(function (item) {
                        result[item._id] = item;
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

    function getVoucherByTerminal (req, res) {
        var usr = req.usr,
            param = {},
            Invoice = require('../models/invoice.js'),
            voucher;

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        Invoice.distinct('codTipoComprob', param, function (err, data) {
            voucher = Voucher.find({_id: {$in: data}});
            voucher.sort({description: 1});
            voucher.lean();
            voucher.exec(function (err, vouchers) {
                res.status(200).send({
                    status: "OK",
                    data: vouchers
                });
            });
        });
    }

/*
router.use(function timeLog(req, res, next){
    log.logger.info('Time: %s', Date.now());
    next();
});
*/
    router.get('/', getVoucherTypes);
    router.get('/:terminal', getVoucherByTerminal);

    return router;
}