/**
 * Created by diego on 7/30/14.
 */

var log4njs = function (options) {


	var mongoose = require('mongoose');
	var Log = require('./models/log4node.js');


	var self = this;
	var useDB = options.useDB || false;

	if (mongoose.connections[0].name === null){
		mongoose.connect(options.mongo_url, options.mongo_opts);
	}

	self.info = function (msg, user){
		logging('info',  msg, user);
	};

	self.warn = function (msg, user){
		logging('warn',  msg, user);
	};

	self.error = function (msg, user){
		logging('error',  msg, user);
	};

	function logging (method, msg, user){

		var logMsg = logSchema();
		logMsg.file = options.file;
		logMsg.message = msg;
		logMsg.user = user;

		var method2exec;
		if (method === 'info') {
			logMsg.type = 'INFO';
			method2exec = console.info;
		}	else if (method === 'warn'){
			logMsg.type = 'WARN';
			method2exec = console.warn;
		}	else {
			logMsg.type = 'ERROR';
			method2exec = console.error;
		}

		if (useDB){
			Log.create(logMsg, function(err, data){
				if (err)
					console.log(err);
			});
		}
		else {
			method2exec(JSON.parse(logMsg));
		}

	}

	function logSchema (){

		var timestamp = new Date();

		return {
			file: '',
			datetime: timestamp.toISOString(),
			user: '',
			message: '',
			type: 'INFO',
			data: {}
		};
	}

};

exports = module.exports = log4njs;
