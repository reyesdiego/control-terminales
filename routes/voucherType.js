/**
 * Created by diego on 6/3/14.
 */

module.exports = function (app){

	function getVoucherTypes(req, res, next){
		var Voucher = require('../models/voucherType.js');

		Voucher.find({}, function (err, data){
			if (err){

			} else {
				var vou={};
				data.forEach(function (item){
					vou[item._id] = item.description;
				});
				res.send(200, {status:'OK', data: data});
			}
		});
	}

	app.get('/voucherTypes', getVoucherTypes);

}