/**
 * Created by diego on 7/3/15.
 */
module.exports = function (url, options, log) {
    "use strict";
    var mongoose = require("mongoose");

    mongoose.Promise = Promise;

    var promise;

    if (options) {
        promise = mongoose.connect(url, options);
    } else {
        promise = mongoose.connect(url);
    }

    promise.then(() => {
        log.logger.info("Mongoose %s Connected to Database. %s", mongoose.version, url);
        global.mongoose.connected = true;
    });

    promise.catch(err => {
        log.logger.error("Database or Mongoose error. %s", err.stack);
    });
    
    global.mongoose = {
        connected: false,
        version: mongoose.version
    };

    process.on("SIGINT", function () {
        mongoose.connection.close(function () {
            log.logger.info("Mongoose default connection disconnected through app termination");
            process.exit();
        });
    });

};

