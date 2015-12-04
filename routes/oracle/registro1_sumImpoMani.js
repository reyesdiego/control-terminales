/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util"),
        moment = require('moment');

    function getRegistro1_sumimpomani(req, res) {

        oracle.pool.getConnection(function (err, connection) {
            var strWhere = '',
                skip,
                limit,
                strSql,
                orderBy;

            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                orderBy = oracle.orderBy(req.query.order);

                skip = parseInt(req.params.skip, 10);
                limit = parseInt(req.params.limit, 10);
                strSql = "SELECT * FROM " +
                            " (SELECT " +
                            "   ID, " +
                            "   TIPOREGISTRO, " +
                            "   SUMARIA, " +
                            "   SUM_ANIO, " +
                            "   SUM_ADUANA, " +
                            "   SUM_TIPO, " +
                            "   SUM_NRO, " +
                            "   SUM_LETRA_CTRL, " +
                            "   CUITATA, " +
                            "   NOMBREATA, " +
                            "   ESTADO, " +
                            "   FECHAREGISTRO, " +
                            "   FECHAARRIBO, " +
                            "   TRANSPORTEVACIO, " +
                            "   PAISPROCEDENCIA, " +
                            "   TRANSPORTISTA, " +
                            "   PAISTRANSPORTISTA, " +
                            "   COMENTARIO, " +
                            "   IMPO_EXPO, " +
                            "   DESCONSOLIDADO, " +
                            "   TITULO, " +
                            "   MERCADERIAABORDO, " +
                            "   VIA, " +
                            "   NACIONALIDADMEDIOTRANSPORTE, " +
                            "   LUGAROPERATIVO, " +
                            "   LUGARDEGIRO, " +
                            "   NOMBREBUQUE, " +
                            "   CODPROCESO, " +
                            "   MANI_CONSOL, " +
                            "   BANDERA_NROBUQUE, " +
                            "   REGISTRADO_POR, " +
                            "   REGISTRADO_EN, " +
                            "   ROW_NUMBER() OVER ( ORDER BY " + orderBy + " ) R " +
                            "   FROM V_REGISTRO1_SUMIMPOMANI %s ) " +
                            "WHERE R BETWEEN :1 and :2";

                if (req.query.buqueNombre || req.query.fechaInicio || req.query.fechaFin || req.query.sumaria) {
                    strWhere += " WHERE ";
                }

                if (req.query.buqueNombre) {
                    strWhere += util.format(" NOMBREBUQUE = '%s' AND ", req.query.buqueNombre);
                }

                if (req.query.fechaInicio) {
                    strWhere += util.format(" FECHAREGISTRO >= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(req.query.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                }

                if (req.query.fechaFin) {
                    strWhere += util.format(" FECHAREGISTRO <= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(req.query.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD'));
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
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_SUMIMPOMANI ";
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
                                    page: skip,
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

        if (req.route.path === '/registro1_sumimpomani/buques') {
            distinct = 'NOMBREBUQUE';
        }

        oracle.pool.getConnection(function (err, connection) {
            var strSql = '';
            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                strSql = util.format("SELECT DISTINCT %s as D FROM REGISTRO1_SUMIMPOMANI ORDER BY %s", distinct, distinct);
            }

            connection.execute(strSql, [], function (err, data) {
                if (err) {
                    oracle.doRelease(connection);
                    res.status(500).send({ status: 'ERROR', data: err.message });
                } else {
                    oracle.doRelease(connection);
                    var result = {status: 'OK', totalCount: data.rows.length, data: data.rows};
                    res.status(200).json(result);
                }
            });

        });

    }

    function getByContenedor(req, res) {
        oracle.pool.getConnection(function (err, connection) {
            var strSql,
                result;
            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                strSql = 'SELECT r1.SUMARIA, ' +
                    'SUBSTR( r1.SUMARIA, 0, 2) as SUM_ANIO, ' +
                    'SUBSTR( r1.SUMARIA, 3, 3) as SUM_ADUANA, ' +
                    'SUBSTR( r1.SUMARIA, 6, 4) as SUM_TIPO, ' +
                    'SUBSTR( r1.SUMARIA, 10, 6) as SUM_NRO, ' +
                    'SUBSTR( r1.SUMARIA, 16, 1) as SUM_LETRA_CTRL, ' +
                    'r2.CONOCIMIENTO, FECHAREGISTRO, FECHAARRIBO, NOMBREBUQUE BUQUE, PESO, p1.NAME P_PROCEDENCIA,' +
                    'r1.REGISTRADO_POR, r1.REGISTRADO_EN ' +
                    'FROM REGISTRO1_SUMIMPOMANI r1 ' +
                    'INNER JOIN REGISTRO2_SUMIMPOMANI r2 ON r1.SUMARIA = r2.SUMARIA ' +
                    'INNER JOIN REGISTRO3_SUMIMPOMANI r3 ON r1.SUMARIA = r3.SUMARIA AND r2.CONOCIMIENTO = r3.CONOCIMIENTO ' +
                    'INNER JOIN COUNTRIES p1 on p1.ID = PAISPROCEDENCIA ' +
                    'WHERE r2.CONOCIMIENTO IN ( ' +
                    '   SELECT CONOCIMIENTO ' +
                    '   FROM REGISTRO4_SUMIMPOMANI ' +
                    '   WHERE CONTENEDOR = :1 )';

                connection.execute(strSql, [req.params.contenedor], function (err, data) {
                    if (err) {
                        oracle.doRelease(connection);
                        res.status(500).send({ status: 'ERROR', data: err.message });
                    } else {
                        oracle.doRelease(connection);
                        result = {
                            status: 'OK',
                            data: data.rows
                        };
                        res.status(200).json(result);
                    }
                });
            }
        });
    }

    function getShipsTrips(req, res) {
        oracle.pool.getConnection(function (err, connection) {
            var strSql = '';
            if (err) {
                console.log(err, "Error acquiring from pool.");
                res.status(500).json({ status: 'ERROR', data: err });
            } else {
                strSql = "select nombrebuque buque, fechaarribo fecha, count(*) cnt " +
                            "    from registro1_sumimpomani " +
                            "    group by nombrebuque, fechaarribo " +
                            "    order by nombrebuque,fechaarribo";

                connection.execute(strSql, [], function (err, data) {
                    var Enumerate,
                        dataQ,
                        result;

                    if (err) {
                        oracle.doRelease(connection);
                        res.status(500).send({ status: 'ERROR', data: err });
                    } else {
                        oracle.doRelease(connection);
                        Enumerate = require("linq");
                        dataQ = Enumerate.from(data.rows);
                        result = dataQ.select(function (item) {
                                return { "buque": item.BUQUE, fecha: item.FECHA};
                            }).toArray();

                        result = {status: "OK", totalCount : result.length, data : result};
                        res.status(200).json(result);
                    }
                });
            }
        });
    }

    // Se deja comentado el middleware ya que no tiene utilidad hasta este momento
    //router.use(function timeLog(req, res, next){
    //log.logger.info('Time registro1_sumimpomani: %s', Date.now());
    //next();
    //});

    router.get('/registro1_sumimpomani/:skip/:limit', getRegistro1_sumimpomani);
    router.get('/sumariaImpo/:contenedor', getByContenedor);
    router.get('/registro1_sumimpomani/shipstrips', getShipsTrips);
    router.get('/registro1_sumimpomani/buques', getDistinct);
    return router;
};