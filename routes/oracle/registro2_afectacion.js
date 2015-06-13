/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util"),
        oracledb = require('oracledb');

    function getRegistro2Afectacion(req, res) {

        pool.getConnection(function (err, connection) {
            var strSql = '',
                oracleUtils,
                orderBy,
                strWhere = '',
                skip,
                limit;

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
                    "    AFECTACION, " +
                    "    AFE_ANIO, " +
                    "    AFE_ADUANA, " +
                    "    AFE_TIPO, " +
                    "    AFE_NRO, " +
                    "    AFE_LETRA_CTRL, " +
                    "    TITULOCOMPLETO, " +
                    "    NRO_LINEA, " +
                    "    COD_EMBALAJE, " +
                    "    TIPO_EMBALAJE, " +
                    "    CANTIDAD, " +
                    "    PESO, " +
                    "    COMENTARIO, " +
                    "    CONDICION_CONTENEDOR, " +
                    "    UNIDADMEDIDA, " +
                    "    TIPO_MERCADERIA, " +
                    "    NUMERACIONBULTOS, " +
                    "    REGISTRADO_POR, " +
                    "    REGISTRADO_EN, " +
                    "    ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO2_AFECTACION %s ) " +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.afectacion) {
                    strWhere += " WHERE ";
                }

                if (req.query.afectacion) {
                    strWhere += util.format(" AFECTACION = '%s' AND ", req.query.afectacion);
                }

                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                if (connection) {
                    connection.execute(strSql, [skip + 1, skip + limit], {outFormat: oracledb.OBJECT}, function (err, data){
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
                            strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO2_AFECTACION";
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
            }
        });

    }

    // Se deja comentado el middleware ya que no tiene utilidad hasta este momento
    //router.use(function timeLog(req, res, next){
    //  log.logger.info('Time registro2_afectacion: %s', Date.now());
    //  next();
    //});

    router.get('/registro2_afectacion/:skip/:limit', getRegistro2Afectacion);

    return router;
};