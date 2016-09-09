/**
 * Created by diego on 08/09/16.
 */
"use strict";

var Constantes = require('./constantes.js');

class MatchPriceOracle {
    constructor (connection) {
        this.cn = connection;
    }

    getNoMatches (params) {
        var promise = new Promise((resolve, reject) => {
            resolve({status: "OK"});
        });
        return promise;
    }
}

class MatchPriceMongoDB {
    constructor (connection) {
        this.model = require('../models/matchPrice.js');
        this.invoice = require('../models/invoice.js');
    }

    getNoMatches (params) {
        var promise = new Promise((resolve, reject) => {
            var moment = require('moment');

            var paramTerminal = params.terminal,
                param = [
                    {
                        $match: {terminal: paramTerminal }
                    },
                    { $unwind: '$match' },
                    { $project: {match: '$match', _id: 0}}
                ];

            this.model.aggregate(param)
                .exec((err, noMatches) => {
                    var arrNoMatches = [],
                        fecha,
                        param = {},
                        parametro;

                    if (!err) {
                        noMatches.forEach(item => {
                            arrNoMatches.push(item.match);
                        });

                        if (params.fechaInicio || params.fechaFin) {
                            param["fecha.emision"] = {};
                            if (params.fechaInicio) {
                                fecha = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
                                param["fecha.emision"]["$gte"] = fecha;
                            }
                            if (params.fechaFin) {
                                fecha = moment(params.fechaFin, 'YYYY-MM-DD').toDate();
                                param["fecha.emision"]['$lte'] = fecha;
                            }
                        }
                        param.terminal = paramTerminal;
                        parametro = [
                            { $match: param},
                            { $unwind: '$detalle'},
                            { $unwind: '$detalle.items'},
                            { $match: {'detalle.items.id' : {$nin: arrNoMatches } } },
                            { $group: {
                                _id: {
                                    code : '$detalle.items.id'
                                }
                            }},
                            {$sort: {'_id.code': 1}}
                        ];
                        this.invoice.aggregate(parametro, (err, data) => {
                            var result = data.map(item => (item._id.code));

                            resolve({
                                status: 'OK',
                                totalCount: result.length,
                                data: result
                            });
                        });
                    }
                });

        });
        return promise;
    }
}

class MatchPrice extends Constantes {
    constructor(connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new MatchPriceOracle(this.connection);
            this.type = this.ORACLE;
        } else {
            this.connection = require('../models/invoice.js');
            this.clase = new MatchPriceMongoDB(this.connection);
            this.type = this.MONGODB;
        }
    }

    getNoMatches (params) {
        return this.clase.getNoMatches(params);
    }

}

module.exports = MatchPrice;