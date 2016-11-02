/**
 * Created by diego on 3/9/15.
 */

module.exports = function (log, app, io, oracle, params) {
    'use strict';
    var serverMain,
        appointment,
        gate,
        invoice,
        ePuertoBue;

    function isValidToken(req, res, next) {

        var Account = require('../models/account.js'),
            incomingToken = req.headers.token;

        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(err.message);
                res.status(403).send({status: 'ERROR', code: err.code, messare: err.message, data: err.data});
            } else {
                req.usr = usr;
                next();
            }
        });
    }

    serverMain = require('./server')(log, params);
    app.use('/', serverMain);

    appointment = require('./impact/appointment')(log, io, oracle);
    app.use('/appointment', isValidToken, appointment);

    gate = require('./impact/gate')(log, io, oracle);
    app.use('/gate', isValidToken, gate);

    invoice = require('./impact/invoice')(log, io, oracle);
    app.use('/invoice', isValidToken, invoice);

    ePuertoBue = require('./impact/ePuertoBue')(log, io, oracle);
    app.use('/ePuertoBue', ePuertoBue);

}