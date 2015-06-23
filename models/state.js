/**
 * Created by diego on 12/10/14.
 */

var mongoose = require("mongoose");

var states = new mongoose.Schema({
    _id: {type: String},
    name: {type: String, required: true},
    description: {type: String, required: true},
    type: {type: String, required: true, enum:['ERROR', 'OK', 'WARN', 'UNKNOWN']}
});

module.exports = mongoose.model('states', states);