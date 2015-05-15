/**
 * Created by diego on 5/11/15.
 */


var mongoose = require('mongoose');
var Invoice = require('./models/invoice.js');
var Account = require('./models/account.js');

var momentApi = require('./include/moment');
var moment = require('moment');

var config = require('./config/config.js');
var mail = require('./include/emailjs');
var util = require('util');
var async = require("async");

var config = require('./config/config.js');
mongoose.connect(config.mongo_url, config.mongo_opts);

mongoose.connection.on('connected', function () {
	console.log("Mongoose version: %s", mongoose.version);
	console.log("Connected to Database. %s",config.mongo_url);
});

mongoose.connection.on('error',function (err) {
	console.log("Database or Mongoose error. %s", err.toString());
});

mongoose.connection.on('disconnected', function () {
	console.log("Mongoose default connection disconnected");
});


var lastInvoices = Invoice.aggregate([
	{ $group : {
		_id : '$terminal',
		lastId : {$max : '$_id'}
	}
	}
]);

lastInvoices.exec(function (err, dataLastInvoices){

	if (err){
		console.log (err);
	} else {
		Account.findEmailToApp('lastInvoice', function (err, usersToSend){
			if (err){
				console.log (err);
			} else {
				if (usersToSend.status === 'OK'){
					var mailer = new mail.mail(config.email);
					async.each(dataLastInvoices, function (item, callback){

						var a = moment();
						var diff = a.diff(momentApi.getDateTimeFromObjectId(item.lastId), 'hours');
						if (diff > 36){
							var subject = util.format("Envío de Comprobantes terminal: %s", item._id);
							var body = util.format("Terminal: %s, su último envío: %s", item._id, momentApi.getDateTimeFromObjectId(item.lastId));
							mailer.send(usersToSend.data,
								subject,
								body,
								function (){
									console.log("%s, envió de mail. %s", new Date(), body);
									callback();
								}
							);
						} else {
							callback();
						}
					}, function (err){
						process.exit(0);
					});

				}

			}
		});
	}


});

process.on('uncaughtException', function(err) {
	log.logger.info("Caught exception: " + err);
});
