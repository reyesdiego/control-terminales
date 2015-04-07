/**
 * Created by diego on 6/3/14.
 */

module.exports = function (log){

	var express = require('express');
	var router = express.Router();

	function getVoucherTypes(req, res){
		var Voucher = require('../models/voucherType.js');

		Voucher.find({}, function (err, data){
			if (err){
				res.status(500).send({status:"ERROR", data: err.message});
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
				res.status(200).send(response);
			}
		});
	}
/*
	router.use(function timeLog(req, res, next){
		log.logger.info('Time: %s', Date.now());
		next();
	});
*/
	router.get('/', getVoucherTypes);

	return router;
}