/**
 * Created by diego on 21/06/16.
 */

module.exports = function (log, io, oracle) {
    "use strict";
    var express = require("express");
    var router = express.Router();

    function addShip(req, res) {
        res.status(200).send({
            status: 'OK',
            data: {}
        });
    }

    function updateShip(req, res) {
        res.status(200).send({
            status: 'OK',
            data: {}
        });
    }

    router.post('/', addShip);
    router.put('/', updateShip);

}
