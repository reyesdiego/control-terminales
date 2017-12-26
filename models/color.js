/*
 * Created on Thu Dec 26 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */
"use strict";

const mongoose = require("mongoose");
const color = new mongoose.Schema({
    _id: { type: String }
});

module.exports = mongoose.model("color", color);
