/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util"),
        moment = require('moment');

    function getRegistro1Solicitud(req, res) {

        oracle.pool.getConnection(function (err, connection) {
            var orderBy,
                strWhere = '',
                strSql,
                skip,
                limit;

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
                    "       SOLICITUD, " +
                    "       SOL_ANIO, " +
                    "       SOL_ADUANA, " +
                    "       SOL_TIPO, " +
                    "       SOL_NRO, " +
                    "       SOL_LETRA_CTRL, " +
                    "       CUITATA, " +
                    "       NOMBREATA, " +
                    "       ESTADO, " +
                    "       PROCESO, " +
                    "       FECHA_REGISTRO, " +
                    "       CUIT_IMPO, " +
                    "       LUGAR_OPERATIVO, " +
                    "       DEPOSITOORIGEN, " +
                    "       DEPOSITODESTINO, " +
                    "       MEDIOTRANSPORTEINTERNO, " +
                    "       NACMEDIOTRANSPINTERNO, " +
                    "       MATRICULAMEDIOTRANSPINTERNO, " +
                    "       COMENTARIO, " +
                    "       SUMARIA, " +
                    "       SUM_ANIO, " +
                    "       SUM_ADUANA, " +
                    "       SUM_TIPO, " +
                    "       SUM_NRO, " +
                    "       SUM_LETRA_CTRL, " +
                    "       NOMBREBUQUE, " +
                    "       REGISTRADO_POR, " +
                    "       REGISTRADO_EN, " +
                    "       ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO1_SOLICITUD %s ) " +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.buqueNombre || req.query.fechaInicio || req.query.fechaFin || req.query.sumaria || req.query.solicitud) {
                    strWhere += " WHERE ";
                }

                if (req.query.buqueNombre) {
                    strWhere += util.format(" NOMBREBUQUE = '%s' AND ", req.query.buqueNombre);
                }

                if (req.query.fechaInicio) {
                    strWhere += util.format(" FECHA_REGISTRO >= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(req.query.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                }

                if (req.query.fechaFin) {
                    strWhere += util.format(" FECHA_REGISTRO <= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(req.query.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                }

                if (req.query.solicitud) {
                    strWhere += util.format(" SOLICITUD = '%s' AND ", req.query.solicitud);
                }

                if (req.query.sumaria) {
                    strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);
                }

                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                connection.execute(strSql, [skip + 1, skip + limit], function (err, data) {
                    if (err) {
                        oracle.doRelease(connection);
                        res.status(500).json({ status: 'ERROR', data: err.message });
                    } else {
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_SOLICITUD";
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

        if (req.route.path === '/registro1_solicitud/buques') {
            distinct = 'NOMBREBUQUE';
        }

        oracle.pool.getConnection(function (err, connection) {
            var strSql = '',
                result;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                strSql = util.format("SELECT DISTINCT %s as D FROM registro1_solicitud WHERE %s is not null ORDER BY %s", distinct, distinct, distinct);

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
    //  log.logger.info('Time registro1_solicitud: %s', Date.now());
    //  next();
    //});

    router.get('/registro1_solicitud/:skip/:limit', getRegistro1Solicitud);
    router.get('/registro1_solicitud/buques', getDistinct);

    return router;
};