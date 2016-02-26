/**
 * Created by diego on 2/23/16.
 */
var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");

require('../include/mongoose.js')(log);
var Gates = require("../models/gate.js");

var stream = Gates.find().limit(3).lean().stream();

stream.on('data', function (doc) {
    var self = this;
    //if (somethingHappened) {
    //    this.pause()
    console.log(doc);
    self.resume();
    //return bakeSomePizza(function () {
    //    self.resume()
    //})
//}
});

stream.on('close', function () {
    console.log("TERMINO");
    process.exit();
});