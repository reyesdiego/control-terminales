/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util"),
        oracledb = require('oracledb');

    function getRegistro2SumImpoMani(req, res) {

        pool.getConnection(function(err, connection) {
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
                    "       REGISTRADO_POR, " +
                    "       REGISTRADO_EN, " +
                    "       ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO2_SUMIMPOMANI %s )" +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.sumaria || req.query.conocimiento) {
                    strWhere += " WHERE ";
                }

                if (req.query.sumaria) {
                    strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);
                }

                if (req.query.conocimiento) {
                    strWhere += util.format(" CONOCIMIENTO = '%s' AND ", req.query.conocimiento);
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
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO2_SUMIMPOMANI ";
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

    // Se deja comentado el middleware ya que no tiene utilidad hasta este momento
    //router.use(function timeLog(req, res, next){
    //  log.logger.info('Time registro2_sumimpomani: %s', Date.now());
    //  next();
    //});

    router.get('/registro2_sumimpomani/:skip/:limit', getRegistro2SumImpoMani);

    return router;
};