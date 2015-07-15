/**
 * Created by diego on 3/9/15.
 */

module.exports = function (log, app, io, pool, params) {
    'use strict';
    var serverMain,
        state,
        match,
        paying,
        price,
        comment,
        appointment,
        appointmentEmailQueue,
        docType,
        unitType,
        task,
        voucherType,
        gate,
        invoice,
        moment = require('moment');

    function isValidToken(req, res, next) {

        var Account = require('../models/account.js'),
            incomingToken = req.headers.token;

        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(err);
                res.status(403).send({status: 'ERROR', data: err});
            } else {
                req.usr = usr;
                next();
            }
        });
    }

    serverMain = require('./server')(log, params);
    app.use('/', serverMain);

    appointment = require('./appointment')(log);
    app.use('/appointments', isValidToken, appointment);

    appointmentEmailQueue = require('./appointmentEmailQueue')(log);
    app.use('/appointmentEmailQueues', isValidToken, appointmentEmailQueue);

    comment = require('./comment')(log);
    app.use('/comments', isValidToken, comment);

    docType = require('./docType')(log);
    app.use('/docTypes', docType);

    gate = require('./gate')(log);
    app.use('/gates', isValidToken, gate);

    invoice = require('./invoice')(log, io, pool);
    app.use('/invoices', isValidToken, invoice);

    match = require('./matchPrice')(log);
    app.use('/matchPrices', isValidToken, match);

    paying = require('./paying')(log);
    app.use('/paying', isValidToken, paying);

    price = require('./price')(log);
    app.use('/prices', isValidToken, price);

    state = require('./state')(log);
    app.use('/states', state);

    task = require('./task')(log);
    app.use('/tasks', isValidToken, task);

    unitType = require('./unitType')(log);
    app.use('/unitTypes', unitType);

    voucherType = require('./voucherType')(log);
    app.use('/voucherTypes', voucherType);

}

