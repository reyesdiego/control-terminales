/**
 * Created by diego on 3/9/15.
 */

module.exports = function (log, app, io, oracle, params) {
    'use strict';
    var serverMain,
        state,
        match,
        mat,
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

    gate = require('./gate')(log, oracle);
    app.use('/gates', isValidToken, gate);

    invoice = require('./invoice')(log, io, oracle);
    app.use('/invoices', isValidToken, invoice);

    mat = require('./mat')(log);
    app.use('/mats', isValidToken, mat);

    match = require('./matchPrice')(log);
    app.use('/matchPrices', isValidToken, match);

    paying = require('./paying')(log);
    app.use('/paying', isValidToken, paying);

    price = require('./price')(log, oracle);
    app.use('/prices', isValidToken, price);

    state = require('./state')(log);
    app.use('/states', state);

    task = require('./task')(log);
    app.use('/tasks', isValidToken, task);

    unitType = require('./unitType')(log);
    app.use('/unitTypes', unitType);

    voucherType = require('./voucherType')(log);
    app.use('/voucherTypes', isValidToken, voucherType);



    app.post('/sendMail', isValidToken, function (req, res) {

        var config = require("../config/config.js");
        var mail = require("../include/emailjs");

        var param = req.body;
        var html = {
            data : param.html,
            alternative: true
        }

        mail = new mail.mail(config.email);

        mail.send(param.to, param.subject, html, function (err, data) {


            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });




    });

}

