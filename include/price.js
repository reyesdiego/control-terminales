/**
 * Created by diego on 6/12/14.
 */

var price = function (){

	this.Price = require("../models/price.js");
	this.matchPrice = require("../models/matchPrice.js");
}

price.prototype = {
	rates: function (callback){
		if (callback !== undefined){
			var selfPrice =this.matchPrice;
			selfPrice.aggregate(
				[
					{ $match: { terminal:{$exists : 1}}},
					{ $project: {match:1, price:1}},
					{$unwind:'$match'}
				], function(err, data){
					selfPrice.populate(data, [{path:'price', match:{rate:{$exists:1}}}], function (err, data){
						var result = [];
						data.forEach(function (item){
							if (item.price != null){
								result.push(item.match);
							}
						});
						callback( undefined, result);
					});
			});
		}
	}
}

exports.price = price;