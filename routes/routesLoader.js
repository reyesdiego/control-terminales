/**
 * Created by diego on 3/9/15.
 */

module.exports = function (app, log, io, mongoose, pool) {
    'use strict';

    function isValidToken(req, res, next) {

        var Account = require('../models/account.js'),
            incomingToken = req.headers.token;

        Account.verifyToken(incomingToken, function (err, usr) {
            if (err) {
                log.logger.error(err);
                res.status(500).send({status: 'ERROR', data: err});
            } else {
                req.usr = usr;
                next();
            }
        });
    }

    var serverMain = require('./server')(log, app, mongoose);
    app.use('/', serverMain);

    var state = require('./state')(log);
    app.use('/states', state);

    var match = require('./matchPrice')(log);
    app.use('/matchPrices', isValidToken, match);

    var price = require('./price')(log);
    app.use('/prices', isValidToken, price);

    var comment = require('./comment')(log);
    app.use('/comments', isValidToken, comment);

    var appointment = require('./appointment')(log, io, app);
    app.use('/appointments', isValidToken, appointment);

    var appointmentEmailQueue = require('./appointmentEmailQueue')(log, io);
    app.use('/appointmentEmailQueues', isValidToken, appointmentEmailQueue);

    var docType = require('./docType')(log);
    app.use('/docTypes', docType);

    var unitType = require('./unitType')(log);
    app.use('/unitTypes', unitType);

    var task = require('./task')(log);
    app.use('/tasks', isValidToken, task);

    var voucherType = require('./voucherType')(log);
    app.use('/voucherTypes', voucherType);

    var gate = require('./gate')(log, io, app);
    app.use('/gates', isValidToken, gate);

    var invoice = require('./invoice')(log, io, pool, app);
    app.use('/invoices', isValidToken, invoice);

}

