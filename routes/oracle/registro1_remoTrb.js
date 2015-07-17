/**
 * Created by diego on 7/17/15.
 */

module.exports = function (log, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require("util"),
        moment = require('moment');

    function getRegistro1Remotrb(req, res) {

        oracle.pool.getConnection(function (err, connection) {
            var strSql = '',
                orderBy,
                strWhere = '',
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
                    "    ID, " +
                    "    TIPOREGISTRO, " +
                    "    FECHA, " +
                    "    DOCUMENTO, " +
                    "    IMPORTADOR_EXPORTADOR, " +
                    "    CUIT_IMPO_EXPO, " +
                    "    IDENTIFICAMANI, " +
                    "    NOMBREATA, " +
                    "    SUMARIA, " +
                    "    TRANSBORDOTIT, " +
                    "    TRANSPORTE, " +
                    "    DESCONOCIDO_1, " +
                    "    PAISPROCEDENCIA, " +
                    "    SITIO, " +
                    "    DESCONOCIDO_2, " +
                    "    CODIGOPUERTO, " +
                    "    FECHAARRIBO, " +
                    "    FECHAREMO, " +
                    "    ADUANA, " +
                    "    BANDERA, " +
                    "    DESCONOCIDO_3, " +
                    "    DESCONOCIDO_4, " +
                    "    REGISTRADO_POR, " +
                    "    REGISTRADO_EN, " +
                    "    ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
                    "   FROM V_REGISTRO1_REMOTRB %s) " +
                    "WHERE R BETWEEN :1 and :2";

                if (req.query.documento || req.query.fechaInicio || req.query.fechaFin) {
                    strWhere += " WHERE ";
                }

                if (req.query.fechaInicio) {
                    strWhere += util.format(" FECHAARRIBO >= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(req.query.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                }

                if (req.query.fechaFin) {
                    strWhere += util.format(" FECHAARRIBO <= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(req.query.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                }

                if (req.query.documento) {
                    strWhere += util.format(" DOCUMENTO = '%s' AND ", req.query.documento);
                }

                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                connection.execute(strSql, [skip + 1, skip + limit], function (err, data) {
                    if (err) {
                        oracle.doRelease(connection);
                        res.status(500).json({ status: 'ERROR', data: err.message });
                    } else {
                        strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_REMOTRB";
                        if (strWhere !== '') {
                            strSql += util.format(" %s", strWhere);
                        }

                        connection.execute(strSql, [], function (err, dataCount) {
                            var total,
                                result;
                            if (err) {
                                oracle.doRelease(connection);

                                res.send(500, { status: 'ERROR', data: err.message });
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

    // Se deja comentado el middleware ya que no tiene utilidad hasta este momento
    //router.use(function timeLog(req, res, next){
    //  log.logger.info('Time registro1_remotrb: %s', Date.now());
    //  next();
    //});

    router.get('/registro1_remotrb/:skip/:limit', getRegistro1Remotrb);

    return router;
};