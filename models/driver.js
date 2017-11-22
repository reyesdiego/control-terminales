"use strict";

const mongoose = require("mongoose");
const driver = new mongoose.Schema({
    _id: {type: Number},
    lastname: {type: String, required: true},
    firstname: {type: String, required: true},
    mobile: {type: String}
});

module.exports = mongoose.model("driver", driver);