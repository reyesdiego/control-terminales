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
							var subject = util.format("Terminal: %s, último envío: %s", item._id, momentApi.getDateTimeFromObjectId(item.lastId));
							mailer.send(usersToSend.data,
								subject,
								subject,
								function (){
									console.log("%s, envió de mail. %s", new Date(), subject);
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

