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
			.populate({path:'match', match:{"codes.terminal":req.params.terminal}},  null, null, {sort:[['terminal', 'asc'],['_id', 'asc']]})
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

		async.forEachSeries( matches, function(match, asyncCallback){

			price.findOne({_id: match._id}, function(err, priceItem){
				if(!err && priceItem) {
					console.log('PriceItem:%s, match old:%s, match new:%s',priceItem._id, priceItem.match, match.codes[0].codes);

					matchPrice.findOne({_id: match._id}, function(err, matchItem){
						if (matchItem){
							matchPrice.findOne({_id: match._id, "codes.terminal": match.codes[0].terminal}, function (err, matchTerminal){
								if (!err && matchTerminal){
									console.log(matchTerminal);
									matchTerminal.codes[0].codes = match.codes[0].codes;
									matchTerminal.save(function(err){
										if (!err){
											console.log('Updated:%s', matchTerminal.codes);
											asyncCallback();
										}
									});
								} else if (!matchTerminal){
									matchItem.codes.push(match.codes[0]);
									matchItem.save(function(err){
										if (!err){
											asyncCallback();
										}
									});
								}
							});
						} else {
							var matchprice = new matchPrice(match);
							matchprice.save(function(err){
								if (!err){
									priceItem.match = match._id;
									priceItem.save(function(){
										console.log('nuevo:%s', matchprice.codes[0].codes);
										asyncCallback();
									})
								}
							})
						}
					});
				}
			});

		}, function (err){
			console.log("matchPrices update completed");
			res.send({data: {matches: matches.length}});
		});

	}

	app.get('/agp/matchprices/:terminal', getMatchPrices);
	app.post('/agp/matchprice', addMatchPrice);
	app.put('/agp/matchprice', addMatchPrice);

};
