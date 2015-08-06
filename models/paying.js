/**
 * Created by diego on 7/14/15.
 ** @Module payment
 */

var mongoose = require("mongoose");

var payings = new mongoose.Schema({
    terminal: {type: String, required: true},
    number: {type: Number, required: true},
    date: {type: Date, required: true},
    vouchers: {type: Number},
    tons: {type: Number},
    total: {type: Number, required: true}
});

module.exports = mongoose.model('payings', payings);