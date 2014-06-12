/**
 * Created by diego on 6/3/14.
 */

module.exports = function (app){

	function getVoucherTypes(req, res, next){
		var Voucher = require('../models/voucherType.js');

		Voucher.find({}, function (err, data){
			if (err){

			} else {
				var result = data;
				if (req.query.type === 'array'){
					result={};
					data.forEach(function (item){
						result[item._id] = item.description;
					});
				}
				res.send(200, {status:'OK', data: result});
			}
		});
	}

	app.get('/voucherTypes', getVoucherTypes);

}