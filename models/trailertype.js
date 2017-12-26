/*
 * Created on Thu Dec 26 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */
"use strict";

const mongoose = require("mongoose");
const trailerType = new mongoose.Schema({
    _id: { type: String }
});

module.exports = mongoose.model("trailertype", trailerType);
