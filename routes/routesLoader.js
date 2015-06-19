/**
 * Created by diego on 3/9/15.
 */

module.exports = function (app, log, io, mongoose, pool) {
    'use strict';
    var serverMain,
        state,
        match,
        price,
        comment,
        appointment,
        appointmentEmailQueue,
        docType,
        unitType,
        task,
        voucherType,
        gate,
        invoice

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

    serverMain = require('./server')(log, app, mongoose);
    app.use('/', serverMain);

    state = require('./state')(log);
    app.use('/states', state);

    match = require('./matchPrice')(log);
    app.use('/matchPrices', isValidToken, match);

    price = require('./price')(log);
    app.use('/prices', isValidToken, price);

    comment = require('./comment')(log);
    app.use('/comments', isValidToken, comment);

    appointment = require('./appointment')(log, io, app);
    app.use('/appointments', isValidToken, appointment);

    appointmentEmailQueue = require('./appointmentEmailQueue')(log, io);
    app.use('/appointmentEmailQueues', isValidToken, appointmentEmailQueue);

    docType = require('./docType')(log);
    app.use('/docTypes', docType);

    unitType = require('./unitType')(log);
    app.use('/unitTypes', unitType);

    task = require('./task')(log);
    app.use('/tasks', isValidToken, task);

    voucherType = require('./voucherType')(log);
    app.use('/voucherTypes', voucherType);

    gate = require('./gate')(log, io, app);
    app.use('/gates', isValidToken, gate);

    invoice = require('./invoice')(log, io, pool, app);
    app.use('/invoices', isValidToken, invoice);

}

