/**
 * Created by diego on 11/17/14.
 */

module.exports = function (app){

	function getUnitTypes(req, res, next){
		var Unit = require('../models/unitType.js');

		Unit.find({}, function (err, data){
			if (err){
				res.send(500, {status:"ERROR", data: err.message});
			} else {
				var result = data;
				if (req.query.type === 'array'){
					result={};
					data.forEach(function (item){
						result[item._id] = item.description;
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

	app.get('/unitTypes', getUnitTypes);

}