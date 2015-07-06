/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log, io) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        Gate = require('../../models/gate.js'),
        util = require('util'),
        mail = require("../../include/emailjs"),
        config = require('../../config/config.js');

    function addGate(req, res) {

        var usr = req.usr,
            gate2insert = req.body,
            inicio,
            fin,
            errMsg,
            strSubject,
            mailer,
            socketMsg;

        if (gate2insert.gateTimestamp === undefined || gate2insert.gateTimestamp === null || gate2insert.gateTimestamp === '') {
            res.status(500).send({status: "ERROR", data: "El Gate debe tener una Fecha Hora válida."});
        } else {

            gate2insert.gateTimestamp = moment(gate2insert.gateTimestamp);

            inicio = gate2insert.turnoInicio;
            if (inicio !== undefined && inicio !== '' && inicio !== null) {
                gate2insert.turnoInicio = moment(inicio);
            } else {
                gate2insert.turnoInicio = null;
            }

            fin = gate2insert.turnoFin;
            if (fin !== undefined && fin !== '' && fin !== null) {
                gate2insert.turnoFin = moment(fin);
            } else {
                gate2insert.turnoFin = null;
            }

            gate2insert.terminal = usr.terminal;
            if (gate2insert.buque === undefined || gate2insert.buque === null) {
                gate2insert.buque = "";
            } else {
                gate2insert.buque = gate2insert.buque.trim();
            }

            if (gate2insert.viaje === undefined || gate2insert.viaje === null) {
                gate2insert.viaje = "";
            } else {
                gate2insert.viaje = gate2insert.viaje.trim();
            }

            if (gate2insert.contenedor === undefined || gate2insert.contenedor === null) {
                gate2insert.contenedor = "";
            } else {
                gate2insert.contenedor = gate2insert.contenedor.trim();
            }

            if (gate2insert) {
                Gate.insert(gate2insert, function (errSave, gateNew) {
                    if (errSave) {

                        errMsg = util.format('%s - ERROR: %s.-%s- \n%s', moment().format("YYYY-MM-DD HH:mm"), errSave.toString(), usr.terminal, JSON.stringify(req.body));
                        log.logger.error(errMsg);

                        strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                        mailer = new mail.mail(config.email);
                        mailer.send(usr.email, strSubject, errMsg);

                        res.status(500).send({status: "ERROR", data: errMsg});
                    } else {
                        log.logger.insert('Gate INS: %s - %s - %s', gateNew._id, usr.terminal, moment(gateNew.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"));
                        socketMsg = {
                            status: 'OK',
                            data: gateNew
                        };
                        io.sockets.emit('gate', socketMsg);
                        res.status(200).send(socketMsg);
                    }
                });
            }
        }
    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.post('/', addGate);

    return router;
};