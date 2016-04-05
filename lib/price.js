/**
 * Created by diego on 2/15/16.
 */
'use strict';


class PriceOracle {
    constructor (connection, terminal) {
        this.terminal = terminal;
        this.cn = connection;
    }

    getPrice (id, callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            result;
        var util = require("util");

        if (pool) {
            strSql = "SELECT T.ID, TERMINAL, CODE, DESCRIPCION, UNIDAD, RATE, FECHA, PRECIO, MONEDA " +
                    "FROM TARIFARIO T " +
                    "INNER JOIN TARIFARIO_PRECIO TP ON T.ID = TP.TARIFARIO_ID " +
                    "WHERE T.ID = :1 AND " +
                    "       (TERMINAL = :2 OR TERMINAL = 'AGP')";

            pool.getConnection(function (err, connection) {
                connection.execute(strSql, [id, self.terminal], {}, function (err, data) {
                    self.cn.doRelease(connection);
                    if (err) {
                        result = {
                            status: 'ERROR',
                            message: err.message,
                            data: err
                        }
                        if (callback) return callback(result);
                    } else {
                        result = {
                            status: 'OK',
                            totalCount: 0,
                            data: null
                        }
                        if (data.rows) {
                            result.totalCount = data.rows.length;
                            result.data = data.rows.map( function (item) {
                                return {
                                    _id: item.ID,
                                    terminal: item.TERMINAL,
                                    description: item.DESCRIPCION,
                                    code: item.CODE,
                                    rate: item.RATE,
                                    unit: item.UNIDAD
                                };
                            })[0];
                        }
                        if (callback) return callback(undefined, result);
                    }
                });
            });
        }

    }

    getPrices (params, callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            strWhere = ' AND ',
            result;
        var util = require("util");


        if (pool) {
            strSql = "SELECT TPP.PRECIO, TPP.MONEDA, T.CODE, T.DESCRIPCION, T.ID, T.TERMINAL, TP.FECHA, T.UNIDAD, T.RATE " +
                "FROM TARIFARIO T " +
                "   left join  (select TARIFARIO_ID, max(fecha) fecha    from TARIFARIO_PRECIO group by TARIFARIO_ID) TP on T.ID = TP.TARIFARIO_ID " +
                "   left join tarifario_precio tpp on tpp.tarifario_id = tp.tarifario_id AND tpp.fecha = tp.fecha " +
                "WHERE (T.TERMINAL = :1 OR T.TERMINAL = 'AGP') %s " +
                "ORDER BY T.TERMINAL, T.CODE";

            if (params.onlyRates) {
                strWhere += " RATE IS NOT NULL AND ";
            }
            if (params.code) {
                strWhere += util.format(" T.CODE = '%s' AND ", params.code);
            }

            strWhere = strWhere.substr(0, strWhere.length - 4);
            strSql = util.format(strSql, strWhere);

            pool.getConnection (function (err, connection) {
                connection.execute(strSql, [self.terminal], {}, function (err, data) {
                    self.cn.doRelease(connection);
                    if (err) {
                        result = {
                            status: 'ERROR',
                            message: err.message,
                            data: err
                        }
                        if (callback) return callback(result);
                    } else {
                        result = {
                            status: 'OK',
                            totalCount: 0,
                            data: []
                        };
                        if (data.rows) {
                            result.totalCount = data.rows.length;
                            result.data = data.rows.map(function (item) {
                                return {
                                    _id: item.ID,
                                    terminal: item.TERMINAL,
                                    code: item.CODE,
                                    description: item.DESCRIPCION,
                                    unit: item.UNIDAD,
                                    rate: item.RATE,
                                    topPrices: [{
                                        from: item.FECHA,
                                        price: item.PRECIO,
                                        currency: item.MONEDA
                                    }]
                                };
                                });
                            }
                        if (callback) return callback(undefined, result);
                    }
                });
            });
        }
    }

    getRates (callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            result;
        var util = require("util");

        if (pool) {
            strSql = "SELECT ID, " +
                "TERMINAL, " +
                "CODE, " +
                "DESCRIPCION, " +
                "UNIDAD, " +
                "RATE " +
                "FROM TARIFARIO " +
                "WHERE RATE IS NOT NULL " +
                "ORDER BY RATE, CODE";
            pool.getConnection(function (err, connection) {
                connection.execute(strSql, [], {}, function (err, data) {
                    self.cn.doRelease(connection);
                    if (err) {
                        result = {
                            status: 'ERROR',
                            message: err.message,
                            data: err
                        }
                        if (callback) return callback(result);
                    } else {
                        result = {
                            status: 'OK',
                            totalCount: 0,
                            data: null
                        }
                        if (data.rows) {
                            result.totalCount = data.rows.length;
                            result.data = data.rows.map( function (item) {
                                return {
                                    _id: item.ID,
                                    terminal: item.TERMINAL,
                                    description: item.DESCRIPCION,
                                    code: item.CODE,
                                    rate: item.RATE,
                                    unit: item.UNIDAD
                                };
                            });
                        }
                        if (callback) return callback(undefined, result);
                    }
                });
            });
        }
    }

    rates (parametro, callback) {
        var self = this;
        var strSql,
            strWhere = '',
            result;
        var util = require("util");
        var pool = this.cn.pool;

        if (pool) {

            strSql = "SELECT TT.CODE, DESCRIPCION " +
                "from TARIFARIO T" +
                "   inner join TARIFARIO_TERMINAL TT ON  T.ID = TT.TARIFARIO_ID " +
                "WHERE RATE is not null AND %s";
            if (self.terminal) {
                strWhere += util.format(" TT.TERMINAL = '%s' AND ", self.terminal);
            }

            strSql = util.format(strSql, strWhere);
            strSql = strSql.substr(0, strSql.length - 4);

            pool.getConnection(function (err, connection) {
                connection.execute(strSql, [], {outFormat: self.cn.oracledb.ARRAY}, function (err, data) {
                    self.cn.doRelease(connection);
                    if (err) {
                        if (callback !== undefined) return callback(err);
                    } else {
                        if (parametro.description) {
                            let g = {};
                            data.rows.map(function (item) {
                                g[item[0]] = item[1];
                            });
                            result = g;
                        } else {
                            result = data.rows.map(function (item) {
                                return item[0];
                            });
                        }
                        if (callback !== undefined) return callback(undefined, result);
                    }
                });
            });

        }
    }

    ratePrices (fecha, callback) {
        var self = this;
        var strSql,
            strWhere = '',
            result;
        var util = require("util");
        var pool = this.cn.pool;

        if (pool) {

            strSql = "SELECT T.DESCRIPCION, T.ID, TT.TERMINAL, TP.FECHA, T.UNIDAD, T.RATE, TT.CODE, TP.PRECIO, TP.MONEDA " +
                    "FROM TARIFARIO T " +
                    "   inner join TARIFARIO_PRECIO TP ON T.ID = TP.TARIFARIO_ID " +
                    "   inner join TARIFARIO_TERMINAL TT ON T.ID = TT.TARIFARIO_ID," +
                    "    (select TARIFARIO_ID, max(fecha) fecha " +
                    "   from TARIFARIO_PRECIO " +
                    "   where FECHA <= TO_DATE(:1, 'RRRR-MM-DD') " +
                    "   group by TARIFARIO_ID) TPP " +
                    "WHERE T.RATE is not null AND " +
                    "   T.ID = TP.TARIFARIO_ID AND " +
                    "   TP.TARIFARIO_ID = TPP.TARIFARIO_ID AND " +
                    "   TP.FECHA = TPP.FECHA AND %s";

            if (self.terminal) {
                strWhere += util.format(" TT.TERMINAL = '%s' AND ", self.terminal);
            }

            strWhere = strWhere.substr(0, strWhere.length - 4);
            strSql = util.format(strSql, strWhere);

            pool.getConnection(function (err, connection) {
                connection.execute(strSql, [fecha], {}, function (err, data) {
                    self.cn.doRelease(connection);
                    if (err) {
                        if (callback !== undefined) return callback (err);
                    } else {
                        let map;
                        map = data.rows.map(function (item) {
                            return {
                                code: item.CODE,
                                price: {
                                    _id: item.ID,
                                    terminal: item.TERMINAL,
                                    description: item.DESCRIPCION,
                                    rate: item.RATE,
                                    topPrices: [{
                                        from: item.FECHA,
                                        price: item.PRECIO,
                                        currency: item.MONEDA
                                    }]
                                }
                            };
                        });
                        if (callback !== undefined) return callback (undefined, map);
                    }
                });
            });

        }
    }

    toString() {
        return "Price class on Oracle 11g";
    }
}

class PriceMongoDB {
    constructor (model, terminal) {
        this.terminal = terminal;
        this.model = model;
        this.matchPrice = require("../models/matchPrice.js");
    }

    getPrice (id, callback) {
        var price = this.model;
        var param,
            result;

        param = {
            _id: id,
            $or : [
                {terminal: "AGP"},
                {terminal: this.terminal}
            ]
        };

        price.findOne(param)
            .exec(function (err, price) {
                if (err) {
                    if (callback) return callback({status: 'ERROR', message: err.message, data: err});
                } else {
                    result = {
                        status: 'OK',
                        totalCount: 0,
                        data: null
                    };
                    if (price) {
                        result.totalCount = 1;
                        result.data = price;
                    }
                    if (callback) return callback(undefined, result);
                }
            });
    }

    getPrices (params, callback) {

        var price = this.model;
        var param = {};

        if (params !== undefined) {
            param['$or'] = [
                {terminal: "AGP"},
                {terminal: this.terminal}
            ];
        }
        if (params.code) {
            param.code = params.code;
        }
        if (params.onlyRates) {
            param.rate = {$exists: true};
        }

        price.find(param, {topPrices : {$slice: -1}})
            .sort({terminal: 1, code: 1})
            .exec(function (err, priceList) {
                if (err) {
                    callback({status: 'ERROR', data: err.message});
                } else {
                    callback(undefined, {
                        status: 'OK',
                        totalCount: priceList.length,
                        data: priceList
                    });
                }
            });

    }

    getRates (callback) {
        var param = {
            terminal: "AGP",
            rate: {$ne: null}
        };

        this.model.find(param)
            .sort({rate: 1, code: 1})
            .exec(function (err, priceList) {
                if (err) {
                    callback({status: 'ERROR', message: err.message});
                } else {
                    let result = {
                        status: 'OK',
                        totalCount: priceList.length,
                        data: priceList
                    };
                    callback(undefined, result);
                }
            });
    }

    rates (parametro, callback) {
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
                params.push({ $match: { terminal: { $exists : true}}});
            }

            params.push({ $project: {match: 1, price: 1}});
            params.push({$unwind: '$match'});
            selfMatchPrice.aggregate(params, function (err, data) {
                selfMatchPrice.populate(data, [{ path: 'price', match: {rate: {$exists: true}}, select: '_id terminal description unit rate topPrices' }], function (err, matchprices) {
                    var ratesDesc = {},
                        result,
                        a;

                    if (err) {
                        if (typeof callback === 'function')
                            return callback(err);
                    } else {
                        result = Enumerable.from(matchprices)
                            .where(function (item){
                                return item.price !== null;
                            }).toArray();

                        if (parametro.description) {
                            a = Enumerable.from(result).select(function(item){
                                ratesDesc[item.match] = item.price.description;
                                return item;
                            }).toArray();
                            result = ratesDesc;
                        } else if (parametro.description !== undefined && parametro.description === false) {
                            result = Enumerable.from(result).select(function(item){
                                return item.match;
                            }).toArray();
                        } else if (parametro.fecha) {
                            a = Enumerable.from(result).select(function(item) {
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

    toString() {
        return "Price class on MongoDB";
    }

}

class Price {
    constructor (terminal, connection) {
        if (typeof terminal === 'string') {
            this.terminal = terminal;
        } else if (typeof terminal === 'object') {
            connection = terminal;
        }
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new PriceOracle(this.connection, this.terminal);
            this.db = 'ORACLE';
        } else {
            this.connection = require('../models/price.js');
            this.clase = new PriceMongoDB(this.connection, this.terminal);
            this.db = 'MONGODB';
        }
    }

    getPrice (id, callback) {
        if (this.terminal === undefined) {
            if (callback) return callback ({status: 'ERROR', message: 'Debe proveer la terminal.'});
        } else {
            this.clase.getPrice(id, callback);
        }
    }

    getPrices (params, callback) {
        if (this.terminal === undefined) {
            if (callback) return callback ({status: 'ERROR', message: 'Debe proveer la terminal.'});
        } else {
            this.clase.getPrices(params, callback);
        }
    }

    getRates (callback) {
        this.clase.getRates(callback);
    }

    rates (withDescription, callback) {
        if (typeof withDescription === 'function') {
            callback = withDescription;
            withDescription = false;
        }
        this.clase.rates({description: withDescription}, callback);
    }

    ratePrices (fecha, callback) {
        var moment = require('moment');
        if (typeof fecha === 'function') {
            callback = fecha;
            fecha = Date.now();
        }
        fecha = moment(fecha);
        if (this.db === 'MONGODB') {
            this.clase.rates({fecha: fecha}, callback);
        } else {
            fecha = moment(fecha).format("YYYY-MM-DD")
            this.clase.ratePrices(fecha, callback);
        }
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }

}


module.exports = Price;