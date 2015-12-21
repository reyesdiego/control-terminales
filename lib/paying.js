/**
 * Created by diego on 12/21/15.
 */

var moment = require("moment");

/**
 * Representa a un pago.
 * @constructor
 * @param {string} terminal - Terminal donde pertenece el/los pagos.
 */
var paying = function (terminal) {

    var Paying = require('../models/paying.js');
    this.terminal = terminal;


};

module.exports = paying;
