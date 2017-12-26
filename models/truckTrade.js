/*
 * Created on Thu Dec 21 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */
"use strict";

const mongoose = require("mongoose");
const truckTrade = new mongoose.Schema({
    _id: { type: String }
});

module.exports = mongoose.model("trucktrade", truckTrade);
