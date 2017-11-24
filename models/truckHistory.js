/*
 * Created on Wed Nov 22 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";
 
const mongoose = require("mongoose");
const truckHistory = new mongoose.Schema({
    _id: {type: String, ref: "trucks"},
    trailerId: {type: String, ref: "trailers"},
    driverId: {type: Number, ref: "drivers"},
    trailers: [{type: String, ref: "trailers"}],
    drivers: [{type: Number, ref: "drivers"}]
});

module.exports = mongoose.model("truckHistory", truckHistory);