/**
 * Created by diego on 3/9/15.
 */

module.exports = function (app, log, io, mongoose, pool){
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

    var registro1_afectacion = require('./oracle/registro1_afectacion')(log, pool);
    app.use('/afip', registro1_afectacion);

    var registro1_detExpo = require('./oracle/registro1_detExpo')(log, pool);
    app.use('/afip', registro1_detExpo);

    var registro1_detImpo = require('./oracle/registro1_detImpo')(log, pool);
    app.use('/afip', registro1_detImpo);

    var registro1_solicitud = require('./oracle/registro1_solicitud')(log, pool);
    app.use('/afip', registro1_solicitud);

    var registro1_sumExpoMane = require('./oracle/registro1_sumExpoMane')(log, pool);
    app.use('/afip', registro1_sumExpoMane);

    var registro1_sumImpoMani = require('./oracle/registro1_sumImpoMani')(log, pool);
    app.use('/afip', registro1_sumImpoMani);

    var registro2_afectacion = require('./oracle/registro2_afectacion')(log, pool);
    app.use('/afip', registro2_afectacion);

    var registro2_detExpo = require('./oracle/registro2_detExpo')(log, pool);
    app.use('/afip', registro2_detExpo);

    var registro2_detImpo = require('./oracle/registro2_detImpo')(log, pool);
    app.use('/afip', registro2_detImpo);

    var registro2_solicitud = require('./oracle/registro2_solicitud')(log, pool);
    app.use('/afip', registro2_solicitud);

    var registro2_sumExpoMane = require('./oracle/registro2_sumExpoMane')(log, pool);
    app.use('/afip', registro2_sumExpoMane);

    var registro2_sumImpoMane = require('./oracle/registro2_sumImpoMani')(log, pool);
    app.use('/afip', registro2_sumImpoMane);

    var registro3_detExpo = require('./oracle/registro3_detExpo')(log, pool);
    app.use('/afip', registro3_detExpo);

    var registro3_detImpo = require('./oracle/registro3_detImpo')(log, pool);
    app.use('/afip', registro3_detImpo);

    var registro3_solicitud = require('./oracle/registro3_solicitud')(log, pool);
    app.use('/afip', registro3_solicitud);

    var registro3_sumExpoMane = require('./oracle/registro3_sumExpoMane')(log, pool);
    app.use('/afip', registro3_sumExpoMane);

    var registro3_sumImpoMane = require('./oracle/registro3_sumImpoMani')(log, pool);
    app.use('/afip', registro3_sumImpoMane);

    var registro4_sumExpoMane = require('./oracle/registro4_sumExpoMane')(log, pool);
    app.use('/afip', registro4_sumExpoMane);

    var registro4_sumImpoMane = require('./oracle/registro4_sumImpoMani')(log, pool);
    app.use('/afip', registro4_sumImpoMane);

    var registro5_sumExpoMane = require('./oracle/registro5_sumExpoMane')(log, pool);
    app.use('/afip', registro5_sumExpoMane);

}

