/**
 * Created by diego on 3/9/15.
 */

module.exports = function (log, app, pool) {
    'use strict';

    function isValidToken(req, res, next) {

        var Account = require('../../models/account.js'),
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

    var registro1_afectacion = require('./registro1_afectacion')(log, pool);
    app.use('/afip', registro1_afectacion);

    var registro1_detExpo = require('./registro1_detExpo')(log, pool);
    app.use('/afip', registro1_detExpo);

    var registro1_detImpo = require('./registro1_detImpo')(log, pool);
    app.use('/afip', registro1_detImpo);

    var registro1_solicitud = require('./registro1_solicitud')(log, pool);
    app.use('/afip', registro1_solicitud);

    var registro1_sumExpoMane = require('./registro1_sumExpoMane')(log, pool);
    app.use('/afip', registro1_sumExpoMane);

    var registro1_sumImpoMani = require('./registro1_sumImpoMani')(log, pool);
    app.use('/afip', registro1_sumImpoMani);

    var registro2_afectacion = require('./registro2_afectacion')(log, pool);
    app.use('/afip', registro2_afectacion);

    var registro2_detExpo = require('./registro2_detExpo')(log, pool);
    app.use('/afip', registro2_detExpo);

    var registro2_detImpo = require('./registro2_detImpo')(log, pool);
    app.use('/afip', registro2_detImpo);

    var registro2_solicitud = require('./registro2_solicitud')(log, pool);
    app.use('/afip', registro2_solicitud);

    var registro2_sumExpoMane = require('./registro2_sumExpoMane')(log, pool);
    app.use('/afip', registro2_sumExpoMane);

    var registro2_sumImpoMane = require('./registro2_sumImpoMani')(log, pool);
    app.use('/afip', registro2_sumImpoMane);

    var registro3_detExpo = require('./registro3_detExpo')(log, pool);
    app.use('/afip', registro3_detExpo);

    var registro3_detImpo = require('./registro3_detImpo')(log, pool);
    app.use('/afip', registro3_detImpo);

    var registro3_solicitud = require('./registro3_solicitud')(log, pool);
    app.use('/afip', registro3_solicitud);

    var registro3_sumExpoMane = require('./registro3_sumExpoMane')(log, pool);
    app.use('/afip', registro3_sumExpoMane);

    var registro3_sumImpoMane = require('./registro3_sumImpoMani')(log, pool);
    app.use('/afip', registro3_sumImpoMane);

    var registro4_sumExpoMane = require('./registro4_sumExpoMane')(log, pool);
    app.use('/afip', registro4_sumExpoMane);

    var registro4_sumImpoMane = require('./registro4_sumImpoMani')(log, pool);
    app.use('/afip', registro4_sumImpoMane);

    var registro5_sumExpoMane = require('./registro5_sumExpoMane')(log, pool);
    app.use('/afip', registro5_sumExpoMane);

}

