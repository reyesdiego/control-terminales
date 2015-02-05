/**
 * Created by diego on 6/12/14.
 */

var price = function (terminal){

	this.Price = require("../models/price.js");
	this.matchPrice = require("../models/matchPrice.js");
	this.terminal = terminal;
}

price.prototype = {
	rates: function (callback){
		var self = this;
		if (callback !== undefined){
			var selfPrice =this.matchPrice;

			var params = [];
			if (self.terminal !== undefined)
				params.push({ $match: { terminal: self.terminal}});
			else
				params.push({ $match: { terminal:{$exists : 1}}});

			params.push({ $project: {match:1, price:1}});
			params.push({$unwind:'$match'});
			selfPrice.aggregate( params, function(err, data){
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