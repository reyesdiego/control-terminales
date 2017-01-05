/**
 * Created by diego on 7/14/15.
 ** @Module payment
 */

var mongoose = require("mongoose");

var payings = new mongoose.Schema({
    terminal: {type: String, required: true},
    preNumber: {type: Number, required: true},
    number: {type: Number},
    date: {type: Date, required: true},
    detail: [{
        _id: {type: String, required: true},
        cant: {type: Number, required: true},
        totalDol: {type: Number, required: true},
        totalPes: {type: Number, required: true},
        iva: {type: Number, required: true},
        total: {type: Number, required: true}
    }],
    account: {type: mongoose.Schema.ObjectId, ref: 'accounts', required: true}
});

module.exports = mongoose.model('payings', payings);