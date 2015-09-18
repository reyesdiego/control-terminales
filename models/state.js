/**
 * Created by diego on 12/10/14.
 */

var mongoose = require("mongoose"),
    State;

State = new mongoose.Schema({
    _id: {type: String},
    name: {type: String, required: true},
    description: {type: String, required: true},
    type: {type: String, required: true, enum: ['ERROR', 'OK', 'WARN', 'UNKNOWN']}
});

State.statics.asKeyValue = function (callback) {
    'use strict';
    var state,
        response = {};
    state = this.find();
    state.exec(function (err, states) {
        if (err) {
            callback(err);
        } else {
            states.forEach(function (item) {
                response[item._id] = item;
            });
            callback(undefined, response);
        }
    });
}

module.exports = mongoose.model('states', State);