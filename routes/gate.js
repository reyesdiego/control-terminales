/**
 * Created by Diego Reyes on 3/21/14.
 */


module.exports = function (app) {

	var gate = require('../models/gate.js');

	function getGates(req, res, next){
		'use static';

//		req.params.date
//		gate.find()



	}

	function addGate(req, res, next){
		'use static';

		var gate2insert = req.body;
		if (gate2insert) {
			gate.insert(gate2insert, function (err, data) {
				if (!err){
					console.log('%s - Gate inserted.', moment().format('YYYY-MM-DD HH:MM'));
					res.send(data);
				} else {
					res.send({"error": err});
				}
			});
		}
	}

	app.post('/gate', addGate);
	app.get('/gates/:date', getGates);
}