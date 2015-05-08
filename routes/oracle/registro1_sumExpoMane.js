/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool){
	'use strict'

	var express = require('express');
	var router = express.Router();

	var util = require("util");

	function getRegistro1SumExpoMane( req, res){

		pool.acquire(function(err, connection) {
			if (err) {
				console.log(err, "Error acquiring from pool.");
				res.status(500).json({ status:'ERROR', data: err });
			} else {
				var oracleUtils = require('../../include/oracle.js')
				oracleUtils = new oracleUtils();
				var orderBy = oracleUtils.orderBy(req.query.order);

				var strWhere = '';
				var skip = parseInt(req.params.skip, 10);
				var limit = parseInt(req.params.limit, 10);
				var strSql = "SELECT * FROM " +
					" (SELECT " +
					"	ID, " +
					"	TIPOREGISTRO, " +
					"	SUMARIA, " +
					"	SUM_ANIO, " +
					"	SUM_ADUANA, " +
					"	SUM_TIPO, " +
					"	SUM_NRO, " +
					"	SUM_LETRA_CTRL, " +
					"	CUITATA, " +
					"	NOMBREATA, " +
					"	CODIGOPROCESO, " +
					"	MANICONSOLIDADO, " +
					"	ESTADO, " +
					"	FECHAREGISTRO, " +
					"	FECHAARRIBO, " +
					"	TRANSPORTEVACIO, " +
					"	PAISPROCEDENCIA, " +
					"	TRANSPORTISTA, " +
					"	PAISTRANSPORTISTA, " +
					"	COMENTARIO, " +
					"	IMPO_EXPO, " +
					"	DESCONSOLIDADO, " +
					"	TITULO, " +
					"	MERCADERIAABORDO, " +
					"	VIA, " +
					"	NACIONALIDADMEDIOTRANSPORTE, " +
					"	LUGAROPERATIVO, " +
					"	LUGARDEGIRO, " +
					"	NOMBREBUQUE, " +
					"	REGISTRADO_POR, " +
					"	REGISTRADO_EN, " +
					"	ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
					"	FROM V_REGISTRO1_SUMEXPOMANE %s ) " +
					"WHERE R BETWEEN :1 and :2";

				if (req.query.buqueNombre || req.query.fechaInicio || req.query.fechaFin || req.query.sumaria)
					strWhere += " WHERE ";

				if (req.query.buqueNombre)
					strWhere += util.format(" NOMBREBUQUE = '%s' AND ", req.query.buqueNombre);

				if (req.query.fechaInicio)
					strWhere += util.format(" FECHAREGISTRO >= TO_DATE('%s', 'RRRR-MM-DD') AND ", req.query.fechaInicio);

				if (req.query.fechaFin)
					strWhere += util.format(" FECHAREGISTRO <= TO_DATE('%s', 'RRRR-MM-DD') AND ", req.query.fechaFin);

				if (req.query.sumaria)
					strWhere += util.format(" SUMARIA = '%s' AND ", req.query.sumaria);

				strWhere = strWhere.substr(0, strWhere.length - 4);
				strSql = util.format(strSql, strWhere);

				connection.execute(strSql,[skip+1, skip+limit], function (err, data){
					if (err){
						pool.destroy(connection);
						res.status(500).json({ status:'ERROR', data: err.message });
					} else {
						strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_SUMEXPOMANE";
						if (strWhere !== '')
							strSql += util.format(" %s", strWhere);

						connection.execute(strSql, [], function (err, dataCount){
							if (err){
								pool.destroy(connection);
								res.status(500).json({ status:'ERROR', data: err.message });
							} else {
								pool.release(connection);

								var total = dataCount[0].TOTAL;
								var result = {
									status:'OK',
									totalCount : total,
									pageCount : (limit > total) ? total : limit,
									data: data };
								res.status(200).json(result);
							}
						});
					}
				});
			}
		});
	}

	function getDistinct (req, res) {

		var distinct = '';

		if (req.route.path === '/registro1_sumexpomane/buques')
			distinct = 'NOMBREBUQUE';

		pool.acquire(function (err, connection){
			if (err) {
				console.log(err, "Error acquiring from pool.");
				res.status(500).json({ status:'ERROR', data: err });
			} else {
				var strSql = util.format("SELECT DISTINCT %s as D FROM REGISTRO1_SUMEXPOMANE ORDER BY %s", distinct, distinct);
			}

			connection.execute(strSql, [], function (err, data){
				if (err){
					pool.destroy(connection);
					res.status(500).send({ status:'ERROR', data: err.message });
				} else {
					pool.release(connection);
					var result = {status: 'OK', totalCount: data.length, data: data};
					res.status(200).json(result);
				}
			});

		});

	}

// Se deja comentado el middleware ya que no tiene utilidad hasta este momento
//	router.use(function timeLog(req, res, next){
//		log.logger.info('Time registro1_sumexpomane: %s', Date.now());
//		next();
//	});

	router.get('/registro1_sumexpomane/:skip/:limit', getRegistro1SumExpoMane);
	router.get('/registro1_sumexpomane/buques', getDistinct);

	return router;
};