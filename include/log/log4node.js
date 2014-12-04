/**
 * Created by diego on 23/10/2014.
 */

var log4njs = function (options) {
	'use strict';

	var self = this;

	var moment	=	require('moment');
	var winston	=	require('winston');
	var fs		=	require('fs');

	var elapsed = 0;

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
			insert:7,
			update:8
		},
		colors: {
			silly: 'magenta',
			verbose: 'cyan',
			info: 'green',
			data: 'grey',
			warn: 'yellow',
			debug: 'blue',
			error: 'red',
			insert: 'yellow',
			update: 'green'
		}
	};

	var transports = [];
	if (options.toConsole)
		transports.push(new (winston.transports.Console)({
			colorize: true,
			raw: false,
			timestamp: true
		}));
	if (options.toFile)
		transports.push(
			new (winston.transports.File)({ filename: options.path + options.filename })
		);

	var logger = module.exports = new (winston.Logger)({
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

	self.getFiles = function (callback){
		if (callback !== undefined && typeof (callback) === 'function'){
			var logFiles = [];
			fs.readdir(self.path, function (err, files) {
				if (err) {
					console.log(err);
					return;
				}
				files.forEach(function (item){
					logFiles.push({title: item, url: self.path + '/' + item});
				});
				callback(logFiles);

			});
		}
	}

	self.startElapsed = function (){
		elapsed = moment();
	}
	self.getElapsed = function (){
		var elapsedEnd = moment();
		elapsed = elapsed.diff(elapsedEnd) * (-1);
		return elapsed;
	}

};

exports = module.exports = log4njs;
