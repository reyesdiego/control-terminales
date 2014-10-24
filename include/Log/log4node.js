/**
 * Created by diego on 23/10/2014.
 */

var log4njs = function (logPath) {
	'use strict';

	var self = this;

	var moment	=	require('moment');
	var winston	=	require('winston');
	var fs		=	require('fs');

// Logging levels
	var config = {
		levels: {
			silly: 0,
			verbose: 1,
			info: 2,
			data: 3,
			warn: 4,
			debug: 5,
			error: 6,
			insert:7
		},
		colors: {
			silly: 'magenta',
			verbose: 'cyan',
			info: 'green',
			data: 'grey',
			warn: 'yellow',
			debug: 'blue',
			error: 'red',
			insert: 'yellow'
		}
	};

	var logger = module.exports = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({
				colorize: true,
				raw: false,
				timestamp: true
			}),
			new (winston.transports.File)({ filename: logPath + 'nohup.out' })
		],
		levels: config.levels,
		colors: config.colors
	});

	this.moment = moment;
	this.logger = logger;
	this.logPath = logPath;

	this.getFiles = function (callback){
		if (callback !== undefined && typeof (callback) === 'function'){
			var logFiles = [];
			fs.readdir(self.logPath, function (err, files) {
				if (err) {
					console.log(err);
					return;
				}
				files.forEach(function (item){
					logFiles.push({title: item, url: self.logPath + '/' + item});
				});
				callback(logFiles);

			});
		}
	}

};

exports = module.exports = log4njs;
