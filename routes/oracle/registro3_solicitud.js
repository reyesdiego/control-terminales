/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util"),
        oracledb = require('oracledb');

    function getRegistro3Solicitud(req, res) {

        pool.getConnection(function (err, connection) {
            var oracleUtils,
                orderBy,
                strWhere = '',
                skip,
                limit,
                strSql;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                oracleUtils = require('../../include/oracle.js');
                oracleUtils = new oracleUtils();
                orderBy = oracleUtils.orderBy(req.query.order);

                skip = parseInt(req.params.skip, 10);
                limit = parseInt(req.params.limit, 10);
                strSql = "SELECT * FROM " +
                    " (SELECT " +
                    "    ID, " +
                    "    TIPOREGISTRO, " +
                    "    SOLICITUD, " +
                    "    SOL_ANIO, " +
                    "    SOL_ADUANA, " +
                    "    SOL_TIPO, " +
                    "    SOL_NRO, " +
                    "    SOL_LETRA_CTRL, " +
                    "    CONTENEDOR, " +
                    "    ESTADO, " +
                    "    REGISTRADO_POR, " +
                    "    REGISTRADO_EN, " +
                    "    ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO3_SOLICITUD %s ) " +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.contenedor || req.query.solicitud) {
                    strWhere += " WHERE ";
                }

                if (req.query.solicitud) {
                    strWhere += util.format(" SOLICITUD = '%s' AND ", req.query.solicitud);
                }

                if (req.query.contenedor) {
                    strWhere += util.format(" CONTENEDOR = '%s' AND ", req.query.contenedor);
                }

                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                connection.execute(strSql, [skip + 1, skip + limit], {outFormat: oracledb.OBJECT}, function (err, data) {
                    if (err) {
                        connection.release(
                            function (err) {
                                if (err) {
                                    console.error(err.message);
                                }
                            }
                        );
                        res.status(500).json({ status: 'ERROR', data: err.message });
                    } else {
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO3_SOLICITUD";
                        if (strWhere !== '') {
                            strSql += util.format(" %s", strWhere);
                        }

                        connection.execute(strSql, [], {outFormat: oracledb.OBJECT}, function (err, dataCount) {
                            var total,
                                result;
                            if (err) {
                                connection.release(
                                    function (err) {
                                        if (err) {
                                            console.error(err.message);
                                        }
                                    }
                                );
                                res.status(500).json({ status: 'ERROR', data: err.message });
                            } else {
                                connection.release(
                                    function (err) {
                                        if (err) {
                                            console.error(err.message);
                                        }
                                    }
                                );
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

        if (req.route.path === '/registro3_solicitud/contenedores') {
            distinct = 'CONTENEDOR';
        }

        pool.getConnection(function (err, connection) {
            var strSql = '',
                result;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                strSql = util.format("SELECT DISTINCT %s as D FROM REGISTRO3_SOLICITUD WHERE %s is not null ORDER BY %s", distinct, distinct, distinct);

                connection.execute(strSql, [], {outFormat: oracledb.OBJECT}, function (err, data) {
                    if (err) {
                        connection.release(
                            function (err) {
                                if (err) {
                                    console.error(err.message);
                                }
                            }
                        );
                        res.status(500).send({ status: 'ERROR', data: err.message });
                    } else {
                        connection.release(
                            function (err) {
                                if (err) {
                                    console.error(err.message);
                                }
                            }
                        );
                        result = {status: 'OK', totalCount: data.length, data: data.rows};
                        res.status(200).json(result);
                    }
                });
            }
        });

    }

    // Se deja comentado el middleware ya que no tiene utilidad hasta este momento
    //router.use(function timeLog(req, res, next){
    //  log.logger.info('Time registro3_solicitud: %s', Date.now());
    //  next();
    //});

    router.get('/registro3_solicitud/:skip/:limit', getRegistro3Solicitud);
    router.get('/registro3_solicitud/contenedores', getDistinct);

    return router;
};