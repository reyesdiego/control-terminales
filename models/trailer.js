/*
 * Created on Thu Nov 23 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";

const mongoose = require("mongoose");
const trailer = new mongoose.Schema({
    _id: {type: String},
    color: {type: String},
    axis: {type: Number},
    type: {type: String}
});

module.exports = mongoose.model("trailer", trailer);
