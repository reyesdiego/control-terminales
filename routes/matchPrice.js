/**
 * Created by Diego Reyes	on 2/18/14.
 */
'use strict';

module.exports = function (app){

	var matchPrice = require('../models/matchPrice.js');
	var price = require('../models/price.js');

	function getMatchPrices (req, res){
		'use strict';

		price.find()
		.populate({path:'match', match:{"codes.terminal":req.params.terminal}})
		.exec(function (err, prices) {
			if(!err) {
				res.send(prices);
			} else {
				console.log('ERROR: ' + err);
			}
		});
	}

	function addMatchPrice (req, res){
		'use strict';

		var async = require('async');

		var matches = req.body;

		async.forEach(matches, function(match, callback){

			var matchprice = new matchPrice(match);

			price.findOne({_id: match.id}, function(err, item){
				if(!err && item) {
					console.log('PriceItem:%s',item._id);

					matchPrice.findOne({_id: match.id}, function(err, matchItem){
						console.log(matchItem);
					})
//					matchprice.save(function (err){
//						if(!err) {
//							console.log('matchprice Created');
//							item.match = match._id;
//							item.save(function(){
//								console.log('price Updated');
//								callback();
////									res.send(matchprice);
//							})
//						} else {
//							console.log('ERROR: ' + err);
//						}
//					});
//				} else if (!item){
//
//				} else {
//					console.log('ERROR: ' + err);
				}
			});


		}, function (err){

		});

	}

	app.get('/agp/matchprices/:terminal', getMatchPrices);
	app.post('/agp/matchprice', addMatchPrice);
	app.put('/agp/matchprice', addMatchPrice);

};
