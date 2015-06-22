/**
 * Created by diego on 10/30/14.
 */

var mongoose = require("mongoose");

var doc = new mongoose.Schema({
    _id: {type: Number},
    description: {type: String, required: true}
});

module.exports = mongoose.model('doctypes', doc);