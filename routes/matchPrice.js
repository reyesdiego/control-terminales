/**
 * Created by Diego Reyes	on 2/18/14.
 */
'use strict';

module.exports = function (app){

	var matchPrice = require('../models/matchPrice.js');
	var price = require('../models/price.js');
	var dateTime = require('../include/moment');

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

		async.forEachSeries( matches, function(match, asyncCallback){

			price.findOne({_id: match._id}, function(err, priceItem){
				if(!err && priceItem) {
					matchPrice.findOne({_id: match._id}, function(err, matchItem){
						if (matchItem){
							matchPrice.findOne({_id: match._id, "codes.terminal": match.codes[0].terminal}, function (err, matchTerminal){
								if (!err && matchTerminal){
									matchTerminal.codes[0].codes = match.codes[0].codes;
									matchTerminal.save(function(err){
										if (!err){
											console.log('%s - Updated Matchprice: %s.', dateTime.getDatetime(), matchTerminal._id);
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
										console.log('%s - New MatchPrice: %s', dateTime.getDatetime(), matchprice._id);
										asyncCallback();
									})
								}
							})
						}
					});
				}
			});

		}, function (err){
			res.send({status:"OK", data: {matches: matches.length}});
		});

	}

	app.get('/agp/matchprices/:terminal', getMatchPrices);
	app.post('/agp/matchprice', addMatchPrice);
	app.put('/agp/matchprice', addMatchPrice);

};
