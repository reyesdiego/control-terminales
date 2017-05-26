/**
 * Created by diego on 10/8/15.
 */

"use strict";

/**
 * Representa una tarifa de una terminal y/o AGP.
 * @constructor
 * @param {string} terminal - Terminal a la que pertenece la tarifa.
 */

var matchPrice = function (terminal) {

    this.terminal = terminal;

};

matchPrice.prototype = {
    /**
     * Obtiene un JSON con el listado de Tarifas con el código de la terminal
     *
     * @param {Object} filtro - Objeto Filtro.
     * @param {string} filtro.code - Id de la tarifa
     * @param {string} filtro.rate - Indica si solo se filtran tarifas de tasas a las cargas
     * @api public
     */
    getPricesTerminal: function (filtro, callback) {
        var MatchPrice = require('../models/matchPrice.js'),
            Price = require('../models/price.js');
        var param;
        var self = this;

        param = {
            $or: [
                {terminal: "AGP"},
                {terminal: self.terminal}
            ]
        };

        if (filtro.rate) {
            param.rate = {$exists: true};
        }

        Price.find(param, {topPrices: true})
            .exec(function (err, prices) {
                var matchPrices,
                    paramMatch = {
                        $or: [
                            {terminal: "AGP"},
                            {terminal: self.terminal}
                        ]
                    };

                if (filtro.code) {
                    paramMatch.match = filtro.code;
                }

                if (!err) {
                    matchPrices = MatchPrice.aggregate([
                        {$match: paramMatch},
                        {$unwind: '$match'},
                        {$project: {price: true, match: true, code: true}}
                    ]);
                    matchPrices.exec(function (err, matches) {
                        var Enumerable = require('linq'),
                            response = [];
                        Enumerable.from(matches)
                            .join(Enumerable.from(prices), '$.price.id', '$._id.id', function (match, price) {
                                response.push({
                                    code: match.match,
                                    topPrices: price.topPrices
                                });
                            }).toArray();
                        callback(undefined, {status: 'OK', data: response});
                    });
                } else {
                    callback({status: 'ERROR', data: err.message});
                }
            });
    },

    getMatches: function (params, callback) {
        var Price = require('../models/price.js'),
            MatchPrice = require('../models/matchPrice.js'),
            paramMatchPrice,
            paramPrice;

        if (params.terminal.toLowerCase() === 'all') {
            paramMatchPrice = [
                {$unwind: '$match'}
            ];
            paramPrice = {};
        } else {
            paramMatchPrice = [
                {
                    $match: {terminal: params.terminal }
                },
                { $unwind: '$match' }
            ];
            paramPrice = {$or: [{terminal: "AGP"}, {terminal: params.terminal }]};
        }

        var s = MatchPrice.aggregate(paramMatchPrice);
        s.exec(function (err, matches) {
            if (!err) {

                Price.find(paramPrice)
                    .exec(function (err, prices) {
                        var result = {},
                            Enumerable = require('linq'),
                            response;

                        if (!err) {
                            response = Enumerable.from(matches)
                                .join(Enumerable.from(prices), '$.price.id', '$._id.id', function (match, price) {
                                    if (params.type) {
                                        match.description = {
                                            'currency': price.currency,
                                            'price': price.topPrice
                                        };
                                    } else {
                                        match.description = price.description;
                                    }
                                    return match;
                                }).toArray();
                            response.forEach(function (item) {
                                result[item.match] = item.description;
                            });

                            callback(undefined, {status: 'OK', data: result});

                        } else {
                            callback({status: 'ERROR', data: err.message});
                        }
                    });

            } else {
                callback({status: 'ERROR', message: err.message, data: err});
            }
        });
    }
};

module.exports = matchPrice;
