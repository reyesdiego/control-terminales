/**
 * Created by diego on 8/28/14.
 */

var mongoose = require('mongoose');
var Account = require('./models/account.js');
var http = require('http');
var mail = require('./include/emailjs');
var config = require('./config/config.js');
var async = require("async");
var moment = require('moment');

mongoose.connect(config.mongo_url, config.mongo_opts);
//mongoose.connect(config.mongo_url);

var date = moment().format('DD-MM-YYYY');

var asyncParallel = [];
var terminals = ['BACTSSA', 'TERMINAL4', 'TRP'];
//var terminals = ['BACTSSA'];
var sendMail = false;

terminals.forEach(function (item){

	asyncParallel.push(function (callback){
		Account.findAll({terminal: item}, function (err, data) {

			if (err)
				console.error(err);
			else {
				if (data.length>0){
					var user = data[0];

					var optionsget = {
						host : '10.1.0.51', // here only the domain name (no http/https !)
						port : 8080,
						path : '/matchPrices/noMatches/'+user.terminal,
						method : 'GET',
						headers : {token: user.token.token}
					};

					var reqGet = http.request(optionsget, function(res) {

						res.on('data', function(d) {

							var result = JSON.parse(d);

							if (result.status === 'OK'){
								if (result.data.length>0){
									var mailer = new mail.mail(sendMail);

									console.log("ya esta %s", item);
									console.log(result.data);

								//mailer.send(user.email,
								mailer.send("dreyes@puertobuenosaires.gob.ar",
										result.data.length.toString() + " CÓDIGOS SIN ASOCIAR AL " + date,
										user.terminal + '\n\n' + result.data,
									function(){
										return callback();
										//process.exit(code=0);
									}
								);

								return callback();

								}
							}
						});
					});
					reqGet.end();
				} else {
					return callback();
				}
			}

		});

	});

});

async.parallel(asyncParallel, function(){
	process.exit(code=0);
});

