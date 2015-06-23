/**
 * Created by diego on 11/17/14.
 */

var mongoose = require("mongoose");

var unit = new mongoose.Schema({
    _id: {type: Number},
    description: {type: String, required: true}
});

module.exports = mongoose.model('unittypes', unit);