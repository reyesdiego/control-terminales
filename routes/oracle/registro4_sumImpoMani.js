/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util");

    function getRegistro4SumImpoMani( req, res) {
        var orderBy,
            strWhere = '',
            skip,
            limit,
            strSql;

        oracle.pool.getConnection(function (err, connection) {
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
                    "       MEDIDA, " +
                    "       CONTENEDOR, " +
                    "       CONDICION, " +
                    "       COMENTARIO, " +
                    "       REGISTRADO_POR, " +
                    "       REGISTRADO_EN, " +
                    "       ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO4_SUMIMPOMANI %s )" +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.sumaria || req.query.conocimiento || req.query.contenedor) {
                    strWhere += " WHERE ";
                }

                if (req.query.sumaria) {
                    strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);
                }

                if (req.query.conocimiento) {
                    strWhere += util.format(" CONOCIMIENTO = '%s' AND ", req.query.conocimiento);
                }

                if (req.query.contenedor) {
                    strWhere += util.format(" CONTENEDOR = '%s' AND ", req.query.contenedor);
                }

                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                connection.execute(strSql, [skip + 1, skip + limit], function (err, data) {
                    if (err) {
                        oracle.doRelease(connection);
                        res.status(500).json({ status: 'ERROR', data: err.message });
                    } else {
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO4_SUMIMPOMANI ";
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

    function getDistinct(req, res) {

        var distinct = '';

        if (req.route.path === '/registro4_sumimpomani/contenedores') {
            distinct = 'CONTENEDOR';
        }

        oracle.pool.getConnection(function (err, connection) {
            var strSql = '',
                result;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                strSql = util.format("SELECT DISTINCT %s as D FROM REGISTRO4_SUMIMPOMANI WHERE %s is not null ORDER BY %s", distinct, distinct, distinct);

                connection.execute(strSql, [], function (err, data) {
                    if (err) {
                        oracle.doRelease(connection);
                        res.status(500).send({ status: 'ERROR', data: err.message });
                    } else {
                        oracle.doRelease(connection);
                        result = {status: 'OK', totalCount: data.length, data: data.rows};
                        res.status(200).json(result);
                    }
                });
            }
        });

    }

    // Se deja comentado el middleware ya que no tiene utilidad hasta este momento
    //router.use(function timeLog(req, res, next){
    //  log.logger.info('Time registro4_sumimpomani: %s', Date.now());
    //  next();
    //});

    router.get('/registro4_sumimpomani/:skip/:limit', getRegistro4SumImpoMani);
    router.get('/registro4_sumimpomani/contenedores', getDistinct);

    return router;
};