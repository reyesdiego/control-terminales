/**
 * Created by diego on 6/12/14.
 */

var price = function (terminal) {
    'use strict';

    this.Price = require("../models/price.js");
    this.matchPrice = require("../models/matchPrice.js");
    this.terminal = terminal;


    this.ratesLocal = function (parametro, callback) {
        var Enumerable = require('linq'),
            selfMatchPrice,
            params = [],
            self = this;

        if (typeof parametro === 'function') {
            callback = parametro;
            parametro.description = false;
        }

        if (callback !== undefined) {
            selfMatchPrice = this.matchPrice;

            if (self.terminal !== undefined) {
                params.push({ $match: { terminal: self.terminal}});
            } else {
                params.push({ $match: { terminal: { $exists : 1}}});
            }

            params.push({ $project: {match: 1, price: 1}});
            params.push({$unwind: '$match'});
            selfMatchPrice.aggregate(params, function (err, data) {
                selfMatchPrice.populate(data, [{ path: 'price', match: {rate: {$exists: 1}} }], function (err, matchprices) {
                    var ratesDesc = {},
                        result,
                        a;

                    if (err) {
                        if (typeof callback === 'function')
                            return callback(err);
                    } else {
                        result = Enumerable.from(matchprices)
                            .where(function (item){
                                return item.price != null;
                            });

                        if (parametro.description === true) {
                            a = result.select(function(item){
                                ratesDesc[item.match] = item.price.description;
                                return item;
                            }).toArray();
                            result = ratesDesc;
                        } else if (parametro.description === false) {
                            result = result.select(function(item){
                                return item.match;
                            }).toArray();
                        } else if (parametro.fecha) {
                            a = result.select(function(item) {
                                var top = Enumerable.from(item.price.topPrices)
                                    .where(function (itemW) {
                                        if (itemW.from < parametro.fecha) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    })
                                    .orderByDescending('$.from')
                                    .toArray();
                                item.price.topPrices = top;

                                ratesDesc = {
                                    code: item.match,
                                    price: item.price
                                };
                                return ratesDesc;
                            }).toArray();
                            result = a;
                        }
                        if (typeof callback === 'function')
                            return callback( undefined, result);
                    }
                });
            });
        }
    }
}

price.prototype = {
	rates: function (withDescription, callback) {

        if (typeof withDescription === 'function') {
            callback = withDescription;
            withDescription = false;
        }

        this.ratesLocal({description: withDescription}, function (err, data) {
            callback(err, data);
        });
    },
    ratePrices: function (fecha, callback) {

        if (typeof fecha === 'function') {
            callback = fecha;
            fecha = Date.now();
        }

        this.ratesLocal({fecha: fecha}, function (err, data) {
            callback(err, data);
        });
    }

}

exports.price = price;