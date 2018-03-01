/**
 * Created by diego on 23/10/2014.
 */

var log4njs = function (options) {
    "use strict";

    var self = this,
        moment  = require("moment"),
        winston = require("winston"),
        fs      = require("fs"),
        elapsed = 0,
        logger,
        config,
        transports,
        timers= {};


    // Logging levels
    config = {
        levels: {
            silly: 0,
            verbose: 1,
            info: 2,
            data: 3,
            warn: 4,
            debug: 5,
            error: 6,
            insert: 7,
            update: 8,
            delete: 9
        },
        colors: {
            silly: "magenta",
            verbose: "cyan",
            info: "green",
            data: "grey",
            warn: "yellow",
            debug: "blue",
            error: "red",
            insert: "yellow",
            update: "green",
            delete: "red"
        }
    };

    transports = [];
    if (options.toConsole) {
        transports.push(new (winston.transports.Console)({
            level: "silly",
            colorize: true,
            raw: false,
            timestamp: function () {
                return moment().format("YYYY-MM-DDThh:mm:ss.SSS") + " | " + process.pid;
            }
        }));
    }

    if (options.toFile) {

        let existe = fs.existsSync(options.path);
        console.log(existe);
        if (!existe) {
            fs.mkdirSync(options.path);
        }

        transports.push(new (winston.transports.File)({
            level: "silly",
            filename: options.path + options.filename,
            json: false,
            formatter: function (options) {
                var result = {
                    level: options.level,
                    message: options.message,
                    timestamp: moment().toISOString(),
                    pid: process.pid
                };
                return JSON.stringify(result);
            }
        }));
    }

    logger = module.exports = new (winston.Logger)({
        transports: transports,
        levels: config.levels,
        colors: config.colors
    });

    self.moment = moment;
    self.logger = logger;
    self.path = options.path;
    self.filename = options.filename;
    self.toConsole = options.toConsole;
    self.toFile = options.toFile;

    self.getFiles = function (callback) {
        var pathFilename = "",
            stats;
        if (callback !== undefined && typeof(callback) === "function") {
            var logFiles = [];
            fs.readdir(self.path, function (err, files) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                files.forEach(function (item) {
                    pathFilename = self.path + "/" + item;
                    stats = fs.statSync(pathFilename);
                    logFiles.push({title: item, mtime: stats.mtime, url: pathFilename});
                });
                logFiles.sort(function compare(a, b) {
                    var time1 = moment(a.mtime),
                        time2 = moment(b.mtime),
                        result = 0;

                    if (time1 > time2) {
                        result = -1;
                    }
                    if (time1 < time2) {
                        result = 1;
                    }

                    return result;
                });

                return callback(undefined, logFiles);
            });
        }
    };

    self.startElapsed = function (name) {
        timers[name] = Date.now();
    };
    self.getElapsed = function (name) {
        var hora = Date.now();
        console.log("%s: %sms", name, hora - timers[name]);
    };
    self.time = function (name) {
        timers[name] = Date.now();
    };
    self.timeEnd = function (name) {
        var ms = Date.now() - timers[name];
        console.log("%s: %sms", name, ms);
        return ms;
    };
};

exports.log = log4njs;
