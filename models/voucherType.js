/**
* Created by diego on 6/3/14.
*/

var mongoose = require("mongoose");

var voucher = new mongoose.Schema({
    _id: {type: Number},
    description: {type: String, required: true},
    abbrev: {type: String},
    type: {type: Number, required: true, enum: [1, -1]}
});

module.exports = mongoose.model('vouchertypes', voucher);