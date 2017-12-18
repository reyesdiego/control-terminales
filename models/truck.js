/*
 * Created on Wed Nov 22 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";

const mongoose = require("mongoose");
const truck = new mongoose.Schema({
    _id: { type: String },
    trade: { type: String },
    color: { type: Number },
    axis: { type: Number }
});

module.exports = mongoose.model("truck", truck);
