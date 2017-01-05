/**
 * Created by diego on 6/3/14.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        VoucherType = require('../lib/voucherType.js');

    VoucherType = new VoucherType(oracle);

    function getVoucherTypes(req, res) {

        VoucherType.getAll({}, {format: req.query.type})
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
            });
    }

    function getVoucherByTerminal (req, res) {
        var usr = req.usr,
            terminal = '';

        if (usr.role === 'agp') {
            terminal = req.params.terminal;
        } else {
            terminal = usr.terminal;
        }

        VoucherType.getByTerminal(terminal)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
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