/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app) {

	var dateTime = require('../include/moment');
	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));
	var gate = require('../models/gate.js');

	function getGates(req, res, next){
		'use static';

//		req.params.date
//		gate.find()



	}

	function addGate(req, res, next){
		'use static';

		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err) {
				console.log("%s - Error: %s", dateTime.getDatetime(), err.error);
				res.send(403);
			} else {
				var gate2insert = req.body;
				gate2insert.terminal = usr.terminal;
				if (gate2insert) {
					gate.insert(gate2insert, function (err, data) {
						if (!err){
							console.log('%s - Gate inserted. - %s', dateTime.getDatetime(), usr.terminal);
							res.send(data);
						} else {
							res.send({"error": err});
						}
					});
				}
			}
		});
	}
	app.post('/gate', addGate);
	app.get('/gates/:date', getGates);
}