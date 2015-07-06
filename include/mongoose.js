/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log) {
    'use strict';
    var config = require('../config/config.js'),
        mongoose = require('mongoose');

    mongoose.connect(config.mongo_url, config.mongo_opts);

    mongoose.connection.on('connected', function () {
        log.logger.info("Mongoose version: %s", mongoose.version);
        log.logger.info("Connected to Database. %s", config.mongo_url);
        global.mongoose.connected = true;
    });

    mongoose.connection.on('error', function (err) {
        log.logger.error("Database or Mongoose error. %s", err.toString());
        log.logger.error("El procese %s se abortará.", process.pid);
        process.exit();

    });
    mongoose.connection.on('disconnected', function () {
        log.logger.error("Mongoose default connection disconnected");
    });

    global.mongoose = {
        connected: false,
        version: mongoose.version
    };

    process.on('SIGINT', function () {
        mongoose.connection.close(function () {
            log.logger.info("Mongoose default connection disconnected through app termination");
            process.exit();
        });
    });

}

