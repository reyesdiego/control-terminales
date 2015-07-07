/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util"),
        oracledb = require('oracledb');

    function getRegistro1Afectacion(req, res) {

        var oracleUtils = require('../../include/oracle.js');

        oracleUtils = new oracleUtils();

        pool.getConnection(function (err, connection) {

            var strWhere = '',
                skip = parseInt(req.params.skip, 10),
                limit = parseInt(req.params.limit, 10),
                orderBy,
                strSql;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {

                orderBy = oracleUtils.orderBy(req.query.order);

                strSql = "SELECT * FROM " +
                    " (SELECT " +
                    "      ID, " +
                    "      TIPOREGISTRO, " +
                    "      AFECTACION, " +
                    "      AFE_ANIO, " +
                    "      AFE_ADUANA, " +
                    "      AFE_TIPO, " +
                    "      AFE_NRO, " +
                    "      AFE_LETRA_CTRL, " +
                    "      CUITATA, " +
                    "      NOMBREATA, " +
                    "      ESTADO, " +
                    "      PROCESO, " +
                    "      FECHA_REGISTRO, " +
                    "      CUITIMPO, " +
                    "      ADUANA_LLEGADA_SALIDA, " +
                    "      PAISDESTINO, " +
                    "      DIASPLAZOTRANSPORTE, " +
                    "      TRANSPORTISTA, " +
                    "      PAISTRANSPORTISTA, " +
                    "      MOTIVOAFECTACION, " +
                    "      IDENTIFICADORMOTIVOMICDTA, " +
                    "      SUMARIA, " +
                    "      SUM_ANIO, " +
                    "      SUM_ADUANA, " +
                    "      SUM_TIPO, " +
                    "      SUM_NRO, " +
                    "      SUM_LETRA_CTRL, " +
                    "      MEDIOTRANSPORTEINTERNO, " +
                    "      NACMEDIOTRANSPINTERNO, " +
                    "      MATRICULAMEDIOTRANSPINTERNO, " +
                    "      LUGAROPERATIVO, " +
                    "      LUGARDEGIRO, " +
                    "      NOMBREBUQUE, " +
                    "      COMENTARIO, " +
                    "      REGISTRADO_POR, " +
                    "      REGISTRADO_EN, " +
                    "      ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO1_AFECTACION %s ) " +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.afectacion || req.query.sumaria || req.query.buqueNombre || req.query.fechaInicio || req.query.fechaFin) {
                    strWhere += " WHERE ";
                }

                if (req.query.afectacion) {
                    strWhere += util.format(" AFECTACION = '%s' AND ", req.query.afectacion);
                }

                if (req.query.sumaria) {
                    strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);
                }

                if (req.query.buqueNombre) {
                    strWhere += util.format(" NOMBREBUQUE = '%s' AND ", req.query.buqueNombre);
                }

                if (req.query.fechaInicio) {
                    strWhere += util.format(" FECHA_REGISTRO >= TO_DATE('%s', 'RRRR-MM-DD') AND ", req.query.fechaInicio);
                }

                if (req.query.fechaFin) {
                    strWhere += util.format(" FECHA_REGISTRO <= TO_DATE('%s', 'RRRR-MM-DD') AND ", req.query.fechaFin);
                }


                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                connection.execute(strSql, [skip, skip + limit], {outFormat: oracledb.OBJECT}, function (err, data) {
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
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_AFECTACION";
                        if (strWhere !== '') {
                            strSql += util.format(" %s", strWhere);
                        }

                        connection.execute(strSql, [], {outFormat: oracledb.OBJECT}, function (err, dataCount) {
                            var result,
                                total;
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

        if (req.route.path === '/registro1_afectacion/buques') {
            distinct = 'NOMBREBUQUE';
        }

        pool.getConnection(function (err, connection) {
            var strSql = '',
                result;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                strSql = util.format("SELECT DISTINCT %s as D FROM REGISTRO1_AFECTACION ORDER BY %s", distinct, distinct);

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
    //  log.logger.info('Time registro1_afectacion: %s', Date.now());
    //  next();
    //});
    router.get('/registro1_afectacion/:skip/:limit', getRegistro1Afectacion);
    router.get('/registro1_afectacion/buques', getDistinct);

    return router;
};