/*
 * Created on Thu Nov 23 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";

const mongoose = require("mongoose");
const trailer = new mongoose.Schema({
    _id: {type: String},
    year: {type: Number},
    axis: {type: Number}
});

module.exports = mongoose.model("trailer", trailer);