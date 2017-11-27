/*
 * Created on Wed Nov 22 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";
 
const mongoose = require("mongoose");
const truckHistory = new mongoose.Schema({
    _id: {type: String, ref: "trucks"},
    trailerId: {type: String, ref: "trailer"},
    driverId: {type: Number, ref: "driver"},
    trailers: [{type: String, ref: "trailer"}],
    drivers: [{type: Number, ref: "driver"}]
});

module.exports = mongoose.model("truckHistories", truckHistory);