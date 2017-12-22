/**
 * Created by diego on 08/09/16.
 */
"use strict";

var Constantes = require("./constantes.js");

class MatchPriceOracle {
    constructor (connection) {
        this.cn = connection;
    }

    add (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle addMatch.", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        var strSql = "INSERT INTO TARIFARIO_TERMINAL (" +
                            "       ID," +
                            "       TARIFARIO_ID," +
                            "       TERMINAL," +
                            "       CODE ) VALUES (" +
                            "       TARIFARIO_SEQ.nextval," +
                            "       :tarifario_id," +
                            "       :terminal," +
                            "       :code )";
                        var param = {
                            tarifario_id: params.price,
                            terminal: params.terminal,
                            code: params.code
                        };
                        connection.execute(strSql, param, {autoCommit: true}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                this.cn.doRelease(connection);
                                resolve({
                                    status: "OK",
                                    data: data
                                });
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getMatchPrices (params) {
        return new Promise((resolve, reject) => {
            var Enumerable = require("linq");
            var pool = this.cn.pool;
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getNoMatches.", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        var onlyRates = "";
                        if (params.onlyRates) {
                            onlyRates = " AND RATE IS NOT NULL ";
                        }
                        var onlyMedida = "";
                        if (params.onlyMedida) {
                            onlyMedida = " AND LARGO IS NOT NULL ";
                        }
                        var onlyNorma = "";
                        if (params.onlyNorma) {
                            onlyNorma = " AND NORMA IS NOT NULL ";
                        }
                        var strSql = `SELECT TT.ID as ID_MATCH, TT.CODE CODE_TERMINAL, APPROVED_BY, PRECIO, FECHA, MONEDA,
                                        T.ID,
                                        T.TIPO TERMINAL,
                                        T.CODE,
                                        T.DESCRIPCION,
                                        T.UNIDAD,
                                        T.RATE,
                                        T.LARGO,
                                        T.NORMA,
                                        T.TARIFARIO_HEADER_ID,
                                        T.MOV,
                                        T.TIPO
                                    FROM TARIFARIO T
                                        LEFT JOIN TARIFARIO_TERMINAL TT ON T.ID = TT.TARIFARIO_ID AND TT.TERMINAL = :1
                                        LEFT JOIN (
                                            SELECT TP.*
                                              FROM TARIFARIO_PRECIO TP,
                                                  ( SELECT MAX(FECHA) as fecha, TARIFARIO_ID
                                                      FROM TARIFARIO_PRECIO
                                                      group by tarifario_id) TP1
                                              WHERE TP1.TARIFARIO_ID = TP.TARIFARIO_ID AND
                                                  tp.fecha = tp1.fecha

                                        ) TPM ON TPM.TARIFARIO_ID = T.ID
                                    WHERE T.TERMINAL = :1 ${onlyRates} ${onlyMedida} ${onlyNorma}
                                    ORDER BY T.TERMINAL`;
                        // WHERE (T.TERMINAL = 'AGP' OR T.TERMINAL = :1) ${onlyRates} ${onlyMedida} ${onlyNorma}
                        connection.execute(strSql, [params.terminal], {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                this.cn.doRelease(connection);
                                var rows = Enumerable.from(data.rows)
                                    .groupBy("x=>JSON.stringify({_id: x.ID, " +
                                                "terminal: x.TERMINAL, " +
                                                "code: x.CODE, " +
                                                "description: x.DESCRIPCION, " +
                                                "unit: x.UNIDAD, " +
                                                "largo: x.LARGO, " +
                                                "norma: x.NORMA, " +
                                                "mov: x.MOV, " +
                                                "price: x.PRECIO, " +
                                                "from: x.FECHA, " +
                                                "currency: x.MONEDA})",
                                    null,
                                    (key, items) => {
                                        var prop = items.getSource();
                                        key = JSON.parse(key);
                                        key.matches = {
                                            match: Enumerable
                                                .from(prop).where(x=>x.ID_MATCH!==null)
                                                .select(x=>({
                                                    id: x.ID_MATCH,
                                                    code: x.CODE_TERMINAL,
                                                    status: (x.APPROVED_BY) ? true : false,
                                                    approvedBy: x.APPROVED_BY
                                                })).toArray()
                                        };
                                        return key;
                                    })
                                    .toArray();
                                resolve({
                                    status: "OK",
                                    totalCount: rows.length,
                                    data: rows
                                });
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getMatchPricesNoAgrupado (params) {
        return new Promise((resolve, reject) => {
            let strWhere = "";

            var pool = this.cn.pool;
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getNoMatches.", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        if (params.onlyRates) {
                            strWhere = " RATE IS NOT NULL AND ";
                        }
                        if (params.terminal) {
                            strWhere = " T.TERMINAL IS NOT NULL AND ";
                        }
                        if (strWhere.length>0) {
                            strWhere = ` WHERE ${strWhere}`;
                        }
                        strWhere = strWhere.substr(0, strWhere.length - 4);

                        var strSql = `SELECT TT.ID as ID_MATCH, TT.CODE CODE_TERMINAL, APPROVED_BY, PRECIO, FECHA, MONEDA,
                                        T.ID,
                                        TT.TERMINAL as TERMINAL,
                                        T.CODE,
                                        T.DESCRIPCION,
                                        T.UNIDAD,
                                        T.MOV,
                                        T.TIPO
                                    FROM TARIFARIO T
                                        INNER JOIN TARIFARIO_TERMINAL TT ON T.ID = TT.TARIFARIO_ID AND TT.TERMINAL = T.TERMINAL
                                        LEFT JOIN (
                                            SELECT TP.*
                                              FROM TARIFARIO_PRECIO TP,
                                                  ( SELECT MAX(FECHA) as fecha, TARIFARIO_ID
                                                      FROM TARIFARIO_PRECIO
                                                      group by tarifario_id) TP1
                                              WHERE TP1.TARIFARIO_ID = TP.TARIFARIO_ID AND
                                                  tp.fecha = tp1.fecha

                                        ) TPM ON TPM.TARIFARIO_ID = T.ID
                                    ${strWhere}
                                    ORDER BY T.TERMINAL`;
                        connection.execute(strSql, [], {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                this.cn.doRelease(connection);
                                var rows = data.rows.map(item => ({
                                    terminal: item.TERMINAL,
                                    mov: item.MOV,
                                    code: item.CODE,
                                    description: item.DESCRIPCION,
                                    unit: item.UNIT,
                                    price: item.PRECIO,
                                    currency: item.MONEDA,
                                    match: item.CODE_TERMINAL
                                }));
                                
                                resolve({
                                    status: "OK",
                                    totalCount: rows.length,
                                    data: rows
                                });
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getMatches (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strWhere = "";
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getMatches.", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {

                        if (params.terminal.toLowerCase() !== "all") {
                            strWhere += ` TT.TERMINAL = '${params.terminal}' AND `;
                        }

                        var strSql = `SELECT TT.CODE, DESCRIPCION, PRECIO, FECHA, MONEDA, MOV
                                        FROM TARIFARIO_TERMINAL TT
                                            INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                                            LEFT JOIN (SELECT TP.TARIFARIO_ID, TP.PRECIO, TP.FECHA, TP.MONEDA
                                                      FROM TARIFARIO_PRECIO TP
                                                      WHERE TP.FECHA = (SELECT MAX(FECHA) FROM TARIFARIO_PRECIO TP1 WHERE TP1.TARIFARIO_ID = TP.TARIFARIO_ID)) TP ON TT.TARIFARIO_ID = TP.TARIFARIO_ID `;

                        if (strWhere.length > 0) {
                            strWhere = ` WHERE ${strWhere.substr(0, strWhere.length - 4)} `;
                        }
                        strSql += strWhere;

                        connection.execute(strSql, [], {})
                            .then(data => {
                                this.cn.doRelease(connection);
                                let result={};
                                if (data.rows.length > 0) {
                                    data.rows.forEach(item => {
                                        if (params.type) {
                                            result[item.CODE] = {
                                                "currency": item.MONEDA,
                                                "price": item.PRECIO
                                            };
                                        } else {
                                            result[item.CODE] = item.DESCRIPCION;
                                        }
                                    });
                                }
                                resolve({
                                    status: "OK",
                                    data: result
                                });
                            })
                            .catch(err => {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getNoMatches (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strWhere = "";
            var moment = require("moment");

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getNoMatches.", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {

                        if (params.fechaInicio) {
                            strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, "YYYY-MM-DD").format("YYYY-MM-DD")}', 'RRRR-MM-DD') AND `;
                        }
                        if (params.fechaFin) {
                            strWhere += ` FECHA_EMISION <= TO_DATE('${moment(params.fechaFin, "YYYY-MM-DD").format("YYYY-MM-DD")}', 'RRRR-MM-DD') AND `;
                        }
                        if (params.razonSocial) {
                            strWhere += ` RAZON = '${params.razonSocial}' AND `;
                        }
                        if (params.code) {
                            strWhere += ` IDE.CODE = '${params.code}' AND `;
                        }

                        if (strWhere.length > 0) {
                            strWhere = ` AND ${strWhere.substr(0, strWhere.length - 4)}`;
                        }

                        var strSql = `SELECT DISTINCT IDE.CODE
                                        FROM INVOICE_HEADER IH
                                            INNER JOIN INVOICE_DETAIL IDE ON IH.ID = IDE.INVOICE_HEADER_ID
                                        WHERE IH.TERMINAL = :1 AND
                                            NOT EXISTS (
                                                        SELECT *
                                                        FROM TARIFARIO_TERMINAL TT
                                                        WHERE TT.CODE = IDE.CODE AND
                                                              TT.TERMINAL = IH.TERMINAL)
                                            ${strWhere}
                                        ORDER BY IDE.CODE`;
                        connection.execute(strSql, [params.terminal], {outFormat: this.cn.oracledb.ARRAY})
                        .then(data => {
                                this.cn.doRelease(connection);
                                let rows = data.rows.map(item => (item[0]));
                                resolve({
                                    status: "OK",
                                    totalCount: rows.length,
                                    data: rows
                                });
                            })
                        .catch(err => {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    /**
     * Obtiene un JSON con el listado de Tarifas con el código de la terminal
     *
     * @param {Object} params - Objeto Filtro.
     * @param {string} params.code - Id de la tarifa
     * @param {string} params.rate - Indica si solo se filtran tarifas de tasas a las cargas
     * @api public
     */
    getPricesTerminal (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var Enumerable = require("linq");
            var code = "";
            var onlyRates = "";

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getPricesTerminal.", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        if (params.code) {
                            code = ` AND TT.CODE = '${params.code}' `;
                        }
                        if (params.rate) {
                            onlyRates = " AND T.RATE IS NOT NULL ";
                        }

                        var strSql = `SELECT TT.CODE, PRECIO, FECHA, MONEDA
                            FROM TARIFARIO_TERMINAL TT
                              INNER JOIN TARIFARIO T ON TT.TARIFARIO_ID = T.ID
                              LEFT JOIN TARIFARIO_PRECIO TP ON TP.TARIFARIO_ID = TT.TARIFARIO_ID
                            WHERE TT.TERMINAL = :1 ${code} ${onlyRates}
                            ORDER BY TT.CODE, FECHA`;
                        connection.execute(strSql, [params.terminal], {})
                            .then(data => {
                                this.cn.doRelease(connection);
                                let rows = Enumerable.from(data.rows)
                                    .groupBy("$.CODE",
                                        null,
                                        (key, items) => {
                                            return {
                                                code: key,
                                                topPrices: items.getSource().map(item => ({
                                                    price: item.PRECIO,
                                                    from: item.FECHA,
                                                    currency: item.MONEDA
                                                }))
                                            };
                                        }
                                    ).toArray();
                                resolve({
                                    status: "OK",
                                    data: rows
                                });
                            })
                            .catch(err => {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }
}

class MatchPriceMongoDB {
    constructor(model) {
        this.model = model;
        this.price = require("../models/price.js");
        this.invoice = require("../models/invoice.js");
    }

    add (params) {
        return new Promise((resolve, reject) => {

            var MatchPrice = this.model;
            var match = params;

                this.price.findOne({_id: match._idPrice}, function (err, priceItem) {
                    var _matchPrice2Add;

                    if (!err && priceItem) {
                        if (match._id !== undefined && match._id !== null) {
                            MatchPrice.findOne({_id: match._id}, function (err, matchItem) {
                                matchItem.match = match.match;
                                matchItem.save(err => {
                                    if (err) {
                                        reject({status: "ERROR",
                                            message: err.message,
                                            data: err});
                                    } else {
                                        resolve({status: "OK", data: {matches: match.match.length}});
                                    }
                                });
                            });
                        } else {
                            _matchPrice2Add = {
                                terminal: match.terminal,
                                code: match.code,
                                match: match.match,
                                price: match._idPrice
                            };
                            _matchPrice2Add = new MatchPrice(_matchPrice2Add);
                            _matchPrice2Add.save(function (err, data) {
                                if (priceItem.matches === null) {
                                    priceItem.matches = [];
                                }
                                priceItem.matches.push(data._id);
                                priceItem.save(err => {
                                    if (err) {
                                        reject({status: "ERROR",
                                            message: err.message,
                                            data: err});
                                    } else {
                                        resolve({status: "OK", data: {matches: match.match.length}});
                                    }
                                });
                            });
                        }
                    } else {
                        reject({status: "ERROR", message: err.message, data: err});
                    }
                });
        });
    }

    getMatchPrices (params) {
        return new Promise((resolve, reject) => {

            var paramTerminal = params.terminal,
                ter = (params.user.role === "agp") ? paramTerminal : params.user.terminal,
                param = {
                    $or : [
                        {terminal: "AGP"},
                        {terminal: ter}
                    ]
                };

            if (params.code) {
                param.code = params.code;
            }

            if (params.onlyRates) {
                if (params.onlyRates !== false) {
                    param.rate = {$exists: true};
                }
            }
            if (params.onlyMedida) {
                if (params.onlyMedida !== false) {
                    param.largo = {$exists: true};
                }
            }

            this.price.find(param)
                .populate({path: "matches", match: {terminal: paramTerminal}})
                .sort({terminal: 1, code: 1})
                .lean()
                .exec(function (err, prices) {
                    if (err) {
                        reject({status: "ERROR", data: err.message});
                    } else {
                        prices = prices.map(item => {
                            var topPrice = {};
                            if (item.topPrices !== undefined && item.topPrices.length > 0) {
                                topPrice = item.topPrices[item.topPrices.length-1];
                            }
                            return {
                                _id: item._id,
                                terminal: item.terminal,
                                code: item.code,
                                description: item.description,
                                unit: item.unit,
                                largo: item.largo,
                                norma: item.norma,
                                price: topPrice.price,
                                from: topPrice.from,
                                matches: item.matches,
                                currency: topPrice.currency
                            };
                        });

                        resolve({
                                status: "OK",
                                totalCount: prices.length,
                                data: prices
                            });
                    }
                });
        });
    }

    getMatches (params) {
        return new Promise((resolve, reject) => {
            var Price = this.price,
                MatchPrice = this.model,
                paramMatchPrice,
                paramPrice;

            if (params.terminal.toLowerCase() === "all") {
                paramMatchPrice = [
                    {$unwind: "$match"}
                ];
                paramPrice = {};
            } else {
                paramMatchPrice = [
                    {
                        $match: {terminal: params.terminal }
                    },
                    { $unwind: "$match" }
                ];
                paramPrice = {$or: [{terminal: "AGP"}, {terminal: params.terminal }]};
            }

            var s = MatchPrice.aggregate(paramMatchPrice);
            s.exec((err, matches) => {
                if (!err) {

                    Price.find(paramPrice)
                        .exec((err, prices) => {
                            var result = {},
                                Enumerable = require("linq"),
                                response;

                            if (!err) {
                                response = Enumerable.from(matches)
                                    .join(Enumerable.from(prices), "$.price.id", "$._id.id", (match, price) => {
                                        if (params.type) {
                                            if (price.topPrices.length>0) {
                                                match.description = {
                                                    "currency": price.topPrices[0].currency,
                                                    "price": price.topPrices[0].price
                                                };
                                            }
                                        } else {
                                            match.description = price.description;
                                        }
                                        return match;
                                    }).toArray();
                                response.forEach(item => {
                                    result[item.match] = item.description;
                                });
                                resolve({status: "OK", data: result});

                            } else {
                                reject({status: "ERROR", data: err.message});
                            }
                        });

                } else {
                    reject({status: "ERROR", message: err.message, data: err});
                }
            });
        });
    }

    getNoMatches (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");

            var paramTerminal = params.terminal,
                param = [
                    {
                        $match: {terminal: paramTerminal }
                    },
                    { $unwind: "$match" },
                    { $project: {match: "$match", _id: 0}}
                ];

            this.model.aggregate(param)
                .exec((err, noMatches) => {
                    var arrNoMatches,
                        fecha,
                        param = {},
                        parametro;

                    if (err) {
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        arrNoMatches = noMatches.map(item => (item.match));

                        if (params.fechaInicio || params.fechaFin) {
                            param["fecha.emision"] = {};
                            if (params.fechaInicio) {
                                fecha = moment(params.fechaInicio, "YYYY-MM-DD").toDate();
                                param["fecha.emision"].$gte = fecha;
                            }
                            if (params.fechaFin) {
                                fecha = moment(params.fechaFin, "YYYY-MM-DD").toDate();
                                param["fecha.emision"].$lte = fecha;
                            }
                        }
                        param.terminal = paramTerminal;
                        parametro = [
                            {$match: param},
                            {$unwind: "$detalle"},
                            {$unwind: "$detalle.items"},
                            {$match: {"detalle.items.id": {$nin: arrNoMatches}}},
                            {
                                $group: {
                                    _id: {
                                        code: "$detalle.items.id"
                                    }
                                }
                            },
                            {$sort: {"_id.code": 1}}
                        ];
                        this.invoice.aggregate(parametro, (err, data) => {
                            var result = data.map(item => (item._id.code));

                            resolve({
                                status: "OK",
                                totalCount: result.length,
                                data: result
                            });
                        });
                    }
                });

        });
    }

    /**
     * Obtiene un JSON con el listado de Tarifas con el código de la terminal
     *
     * @param {Object} params - Objeto Filtro.
     * @param {string} params.code - Id de la tarifa
     * @param {string} params.rate - Indica si solo se filtran tarifas de tasas a las cargas
     * @api public
     */
    getPricesTerminal (params) {
        return new Promise((resolve, reject) => {
            var MatchPrice = this.model,
                Price = this.price;
            var param;

            param = {
                $or: [
                    {terminal: "AGP"},
                    {terminal: params.terminal}
                ]
            };

            if (params.rate) {
                param.rate = {$exists: true};
            }

            Price.find(param, {topPrices: true})
                .exec((err, prices) => {
                    var matchPrices,
                        paramMatch = {
                            $or: [
                                {terminal: "AGP"},
                                {terminal: params.terminal}
                            ]
                        };
                    if (params.code) {
                        paramMatch.match = params.code;
                    }

                    if (!err) {
                        matchPrices = MatchPrice.aggregate([
                            {$unwind: "$match"},
                            {$match: paramMatch},
                            {$project: {price: true, match: true, code: true}}
                        ]);
                        matchPrices.exec((err, matches) => {
                            var Enumerable = require("linq"),
                                response = [];
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                Enumerable.from(matches)
                                    .join(Enumerable.from(prices), "$.price.id", "$._id.id", function (match, price) {
                                        response.push({
                                            code: match.match,
                                            topPrices: price.topPrices
                                        });
                                    }).toArray();
                                resolve({status: "OK", data: response});
                            }
                        });
                    } else {
                        reject({status: "ERROR", message: err.message, data: err});
                    }
                });
        });
    }
}

class MatchPrice extends Constantes {
    constructor(connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new MatchPriceOracle(this.connection);
        } else {
            this.connection = require("../models/matchPrice.js");
            this.clase = new MatchPriceMongoDB(this.connection);
        }
    }

    add(params) {
        return this.clase.add(params);
    }

    getMatchPrices (params) {
        return this.clase.getMatchPrices(params);
    }
    getMatchPricesNoAgrupado (params) {
        return this.clase.getMatchPricesNoAgrupado(params);
    }

    getMatches (params) {
        return this.clase.getMatches(params);
    }

    getNoMatches (params) {
        return this.clase.getNoMatches(params);
    }

    getPricesTerminal (params) {
        return this.clase.getPricesTerminal(params);
    }
}

module.exports = MatchPrice;