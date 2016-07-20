/**
 * Created by diego on 21/06/16.
 */

module.exports = function (log, io, oracle) {
    "use strict";
    var express = require("express");
    var router = express.Router();
    var ePuertoBue = require('../../lib/ePuertoBue.js');


    function addShip(req, res) {
        var ship = req.body;

        var ePuertoBueMongo = new ePuertoBue();
        ePuertoBueMongo.addShip(ship)
            .then((data) => {
                log.logger.info("Ingresó Buque %s, Vanguardia: %s", data.buque, data.entradaVanguardia.toString());
                res.status(200).send({
                    status: 'OK',
                    data: data
                });
            })
            .catch((err) => {
                log.logger.error("En el ingreso de Buque %s", ship.buque);
                res.status(500).send({
                    status: 'ERROR',
                    message: err.message
                });
            });

        var ePuertoBueOracle = new ePuertoBue(oracle);
        ePuertoBueOracle.addShip(ship)
            .then((data) => {
                log.logger.info("ORA: Ingresó Buque %s", data);
            })
            .catch((err) => {
                log.logger.error("ORA: En el ingreso de Buque %s", ship);
            });

    }

    function updateShip(req, res) {
        var ship = req.body;
        ePuertoBue.updateShip(ship)
            .then((data) => {
                res.status(200).send({
                    status: 'OK',
                    data: data
                });
            })
            .catch((err) => {
                res.status(500).send({
                    status: 'ERROR',
                    message: err.message
                });
            });
    }

    router.post('/ship', addShip);
    router.put('/ship', updateShip);

    return router;

}
