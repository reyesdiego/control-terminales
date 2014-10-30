/**
 * Created by diego on 10/30/14.
 */

module.exports = function (app){

	function getDocTypes(req, res, next){
		var Doc = require('../models/docType.js');

		Doc.find({}, function (err, data){
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

	app.get('/docTypes', getDocTypes);

}