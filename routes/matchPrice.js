/**
 * Created by Diego Reyes	on 2/18/14.
 */
'use strict';

module.exports = function (app){

	var MatchPrice = require('../models/matchPrice.js');
//	var matchPrice = require('../models/matchPrice.js');
	var price = require('../models/price.js');
	var dateTime = require('../include/moment');

	var path = require('path');
	var Account = require(path.join(__dirname, '..', '/models/account'));

	function getMatchPrices (req, res){

		'use strict';
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error('%s - Error: %s', dateTime.getDatetime(), err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {

				var param = {
					$or : [
						{terminal:	"AGP"},
						{terminal:	usr.terminal}
					]
				};

				if (req.query.code){
					param.code = req.query.code;
				}

				price.find(param)
					.populate({path:'matches', match:{"terminal":req.params.terminal}})
					.sort({terminal:1,code:1})
					.exec(function (err, prices) {
						if(!err) {
							res.send(200, {status:'OK', data:prices});
						} else {
							console.error('%s - Error: %s', dateTime.getDatetime(), err);
							res.send(500, {status:'ERROR', data: err});
						}
					});


			}
		});
	}

	function getMatches (req, res){

		'use strict';
		var incomingToken = req.headers.token;
		Account.verifyToken(incomingToken, function(err, usr) {
			if (err){
				console.error('%s - Error: %s', dateTime.getDatetime(), err);
				res.send(500, {status:"ERROR", data:"Invalid or missing Token"});
			} else {

				var param = [
					{
						$match: {terminal:	usr.terminal }
					},
					{	$unwind: '$match' }
				];

				var s = MatchPrice.aggregate(param);
				s.exec(function (err, matches) {
					if(!err) {

						price.find({$or: [{terminal:"AGP"}, {terminal: usr.terminal}]})
							.exec(function (err, prices) {
								if(!err) {
									var result = {};
									var Enumerable = require('linq');
									var response = Enumerable.from(matches)
										.join(Enumerable.from(prices), '$.price.id', '$._id.id', function (match, price){
											match.description = price.description;
											return match;
										}).toArray();
									response.forEach(function (item){
										result[item.code] = item.description;
									});

									res.send(200, {status:'OK', data: result});

								} else {
									console.error('%s - Error: %s', dateTime.getDatetime(), err);
									res.send(500, {status:'ERROR', data: err});
								}
							});


					} else {
						console.error('%s - Error: %s', dateTime.getDatetime(), err);
						res.send(500, {status:'ERROR', data: err});
					}
				});


			}
		});
	}

	function addMatchPrice (req, res){
		'use strict';

		var async = require('async');

		var matches = req.body;

		async.forEachSeries( matches, function(match, asyncCallback){

			price.findOne({_id: match._idPrice}, function(err, priceItem){
				if(!err && priceItem) {
					if (match._id !== undefined && match._id != null){
						MatchPrice.findOne({_id: match._id}, function(err, matchItem){
							matchItem.match = match.match;
							matchItem.save(function (err) {
								asyncCallback();
							})
						});
					} else {
						var _matchPrice2Add = {
							terminal: match.terminal,
							code: match.code,
							match: match.match,
							price: match._idPrice
						};
						_matchPrice2Add = new MatchPrice(_matchPrice2Add);
						_matchPrice2Add.save(function (err, data){
							if (priceItem.matches == null){
								priceItem.matches = [];
							}
							priceItem.matches.push(data._id);
							priceItem.save();
							asyncCallback();
						});

					}

/*
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
					*/
				}
			});

		}, function (err){
			res.send({status:"OK", data: {matches: matches.length}});
		});

	}

	app.get('/agp/matchprices/:terminal', getMatchPrices);
	app.get('/agp/matches/:terminal', getMatches);
	app.post('/agp/matchprice', addMatchPrice);
	app.put('/agp/matchprice', addMatchPrice);

};
