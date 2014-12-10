/**
 * Created by diego on 12/10/14.
 */

module.exports = function (app){

	function getStates(req, res, next){
		var State = require('../models/state.js');

		State.find({}, function (err, data){
			if (err){
				res.send(500, {status:"ERROR", data: err.message});
			} else {
				var result = data;
				if (req.query.type === 'array'){
					result={};
					data.forEach(function (item){
						result[item._id] = {name: item.name, description: item.description};
					});
				}
				var response = {
					status:		'OK',
					totalCount:	data.length,
					data: result
				};
				res.send(200, response);
			}
		});
	}

	app.get('/states', getStates);

}