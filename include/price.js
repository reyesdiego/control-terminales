/**
 * Created by diego on 6/12/14.
 */

var price = function (terminal){

	this.Price = require("../models/price.js");
	this.matchPrice = require("../models/matchPrice.js");
	this.terminal = terminal;

}

price.prototype = {
	rates: function (withDescription, callback){

		if (typeof withDescription === 'function'){
			callback = withDescription;
		}

		var Enumerable = require('linq');
		var self = this;
		if (callback !== undefined){
			var selfMatchPrice =this.matchPrice;

			var params = [];
			if (self.terminal !== undefined)
				params.push({ $match: { terminal: self.terminal}});
			else
				params.push({ $match: { terminal:{$exists : 1}}});

			params.push({ $project: {match:1, price:1}});
			params.push({$unwind:'$match'});
			selfMatchPrice.aggregate( params, function(err, data){
				selfMatchPrice.populate(data, [{ path:'price', match:{rate:{$exists:1}} }], function (err, matchprices){
						if (err) {
							if (typeof callback === 'function')
								return callback(err);
						} else {
							var ratesDesc = {};
							var result = Enumerable.from(matchprices)
								.where(function (item){
									return item.price != null;
								});

							if (withDescription === true){
								var a = result.select(function(item){
									ratesDesc[item.match] = item.price.description;
									return item;
								}).toArray();
								result = ratesDesc;
							} else {
								result = result.select(function(item){
									return item.match;
								}).toArray();
							}
							if (typeof callback === 'function')
								return callback( undefined, result);
						}
					});
			});
		}
	}
}

exports.price = price;