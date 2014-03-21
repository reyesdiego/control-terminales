/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app) {
	var gate = require('../models/gate.js');


	function addGate(req, res, next){
		'use static';

		var gate2insert = req.body;
		if (gate2insert) {
			gate.insert(gate2insert, function (err, data){
				if (!err){
					console.log('Gate inserted at %s', new Date().toString());
					res.send(data);
				} else {
					res.send({"error": err});
				}
			})
		}
	}


	app.post('/gate', addGate);
}