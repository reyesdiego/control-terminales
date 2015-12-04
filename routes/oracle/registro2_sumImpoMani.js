/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util");

    function getRegistro2SumImpoMani(req, res) {

        oracle.pool.getConnection(function(err, connection) {
            var orderBy,
                strWhere = '',
                skip,
                limit,
                strSql;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                orderBy = oracle.orderBy(req.query.order);

                skip = parseInt(req.params.skip, 10);
                limit = parseInt(req.params.limit, 10);
                strSql = "SELECT * FROM " +
                    " (SELECT " +
                    "       ID, " +
                    "       TIPOREGISTRO, " +
                    "       SUMARIA, " +
                    "       SUM_ANIO, " +
                    "       SUM_ADUANA, " +
                    "       SUM_TIPO, " +
                    "       SUM_NRO, " +
                    "       SUM_LETRA_CTRL, " +
                    "       CONOCIMIENTO, " +
                    "       TITULOCOMPLETO, " +
                    "       MARCA, " +
                    "       CONSIGNATARIO, " +
                    "       NOTIFICARA, " +
                    "       COMENTARIO, " +
                    "       CONSOLIDADO, " +
                    "       TRANSITO_TRANSBORDO, " +
                    "       FRACCIONADO, " +
                    "       BLOQUEO, " +
                    "       PTOEMBARQUE, " +
                    "       REGISTRADO_POR, " +
                    "       REGISTRADO_EN, " +
                    "       ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO2_SUMIMPOMANI %s )" +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.sumaria || req.query.conocimiento || req.query.transbordo) {
                    strWhere += " WHERE ";
                }

                if (req.query.sumaria) {
                    strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);
                }

                if (req.query.conocimiento) {
                    strWhere += util.format(" CONOCIMIENTO = '%s' AND ", req.query.conocimiento);
                }

                if (req.query.transbordo) {
                    strWhere += util.format(" TRANSITO_TRANSBORDO = '%s' AND ", req.query.transbordo);
                }

                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                connection.execute(strSql, [skip + 1, skip + limit], function (err, data) {
                    if (err) {
                        oracle.doRelease(connection);
                        res.status(500).json({ status: 'ERROR', data: err.message });
                    } else {
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO2_SUMIMPOMANI ";
                        if (strWhere !== '') {
                            strSql += util.format(" %s", strWhere);
                        }

                        connection.execute(strSql, [], function (err, dataCount) {
                            var total,
                                result;

                            if (err) {
                                oracle.doRelease(connection);
                                res.status(500).json({ status: 'ERROR', data: err.message });
                            } else {
                                oracle.doRelease(connection);
                                total = dataCount.rows[0].TOTAL;
                                result = {
                                    status: 'OK',
                                    totalCount: total,
                                    pageCount: (limit > total) ? total : limit,
                                    data: data.rows
                                };
                                res.status(200).json(result);
                            }
                        });
                    }
                });
            }
        });
    }

    function transbordos (req, callback) {

        oracle.pool.getConnection(function(err, connection) {
            var orderBy,
                strWhere = req.where,
                skip,
                limit,
                strSql,
                total,
                result;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                callback({ status: 'ERROR', data: err });
            } else {

                skip = req.skip;
                limit = req.limit;
                orderBy = " SUMARIA ";

                strSql = "SELECT * FROM " +
                    " ( SELECT SUMARIA, " +
                    "       FECHAARRIBO, " +
                    "       CONOCIMIENTO, " +
                    "       NOMBREATA, " +
                    "       NRO_LINEA, " +
                    "       COUNTRY, " +
                    "       PORT, " +
                    "       NOMBREBUQUE, " +
                    "       CONTENEDOR, " +
                    "       MEDIDA, " +
                    "       PESO, " +
                    "       LUGAROPERATIVO, " +
                    "       EMBALAJE, " +
                    "       IMPO_EXPO, " +
                    "       ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    " FROM V_TRANSBORDO_IMPO %s )" +
                    "WHERE R BETWEEN :1 and :2 ";

                strSql = util.format(strSql, strWhere);

                connection.execute(strSql, [skip + 1, skip + limit], function (err, data) {

                    if (err) {
                        oracle.doRelease(connection);
                        callback({ status: 'ERROR', data: err.message });
                    } else {
                        oracle.doRelease(connection);
                        callback(undefined, data.rows);
                    }
                });
            }
        });
    }

    function getTransbordos(req, res) {

        var strWhere = '',
            skip,
            limit;

        limit = parseInt(req.params.limit, 10);

        if (req.query.sumaria || req.query.conocimiento || req.query.buqueNombre || req.query.contenedor) {
            strWhere += " WHERE ";
        }

        if (req.query.sumaria) {
            strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);
        }

        if (req.query.conocimiento) {
            strWhere += util.format(" CONOCIMIENTO = '%s' AND ", req.query.conocimiento);
        }

        if (req.query.buqueNombre) {
            strWhere += util.format(" NOMBREBUQUE = '%s' AND ", req.query.buqueNombre);
        }

        if (req.query.contenedor) {
            strWhere += util.format(" CONTENEDOR = '%s' AND ", req.query.contenedor);
        }

        strWhere = strWhere.substr(0, strWhere.length - 4);
        req.where = strWhere;
        req.skip = parseInt(req.params.skip, 10);
        req.limit = parseInt(req.params.limit, 10);

        transbordos(req, function (err, data) {
            var strSql;

            if (err) {
                res.status(200).json(err);
            } else {

                strSql = "SELECT COUNT(*) AS TOTAL FROM V_TRANSBORDO_IMPO ";
                if (strWhere !== '') {
                    strSql += util.format(" %s", strWhere);
                }

                oracle.pool.getConnection(function(err, connection) {
                    if (err) {
                        res.status(500).json(err);
                    } else {
                        connection.execute(strSql, [], function (err, dataCount) {
                            var total,
                                result;

                            if (err) {
                                oracle.doRelease(connection);
                                res.status(500).json({status: 'ERROR', data: err.message});
                            } else {
                                oracle.doRelease(connection);
                                total = dataCount.rows[0].TOTAL;
                                result = {
                                    status: 'OK',
                                    totalCount: total,
                                    pageCount: (limit > total) ? total : limit,
                                    data: data
                                };
                                res.status(200).json(result);
                            }
                        });
                    }
                });
            }
        });
    }

    function getTransbordo(req, res) {
        var resultTer,
            strWhere = '',
            Enumerable,
            result,
            firstRow;

        if (req.query.sumaria) {
            strWhere += " WHERE ";

            strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);
            strWhere = strWhere.substr(0, strWhere.length - 4);
            req.where = strWhere;
            req.skip = 0;
            req.limit = 100000000;

            transbordos(req, function (err, data) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    firstRow = data[0];
                    resultTer = {
                        SUMARIA: firstRow.SUMARIA,
                        FECHAARRIBO: firstRow.FECHAARRIBO,
                        NOMBREBUQUE: firstRow.NOMBREBUQUE,
                        CONOCIMIENTOS: []
                    };
                    Enumerable = require('linq');
                    resultTer.CONOCIMIENTOS = Enumerable.from(data)
                        .groupBy("$.CONOCIMIENTO", null,
                        function (key, g) {
                            var prop = g.getSource(),
                                ter = {
                                    CONOCIMIENTO: key,
                                    PESO: prop[0].PESO,
                                    CONTENEDORES: []
                                };
                            prop.forEach(function (item) {
                                var contenedor;
                                contenedor = {
                                    CONTENEDOR: item.CONTENEDOR,
                                    MEDIDA: item.MEDIDA
                                }
                                ter.CONTENEDORES.push(contenedor);
                                //for (var pro in item){
                                //    if (pro !== 'buque')
                                //        ter.viajes.push(item[pro]);
                                //}
                            });
                            return ter;
                        }).toArray();

                    result = {
                        status: 'OK',
                        data: resultTer
                    };
                    res.status(200).send(result);
                }
            });
        }
    }

    // Se deja comentado el middleware ya que no tiene utilidad hasta este momento
    //router.use(function timeLog(req, res, next){
    //  log.logger.info('Time registro2_sumimpomani: %s', Date.now());
    //  next();
    //});

    router.get('/registro2_sumimpomani/:skip/:limit', getRegistro2SumImpoMani);
    router.get('/transbordosImpo/:skip/:limit', getTransbordos);
    router.get('/transbordoImpo', getTransbordo);

    return router;
};