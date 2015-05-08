/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool){
	'use strict'

	var express = require('express');
	var router = express.Router();

	var util = require("util");

	function getRegistro1DetExpo( req, res){

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
					"		ID, " +
					"		TIPOREGISTRO, " +
					"		DETALLADA, " +
					"		DET_ANIO, " +
					"		DET_ADUANA, " +
					"		DET_TIPO, " +
					"		DET_NRO, " +
					"		DET_LETRA_CTRL, " +
					"		IMPO_EXPO, " +
					"		DIVISAFOB, " +
					"		MONTOFOB, " +
					"		DIVISAFLETE, " +
					"		MONTOFLETE, " +
					"		DIVISASEGURO, " +
					"		MONTOSEGURO, " +
					"		ADUANASALIDA, " +
					"		PAISDESTINO, " +
					"		FECOFI, " +
					"		FECHA_CUMPLIDO, " +
					"		FECOFIPOSTEMBARQUE, " +
					"		CODIGOLIQUIDADO, " +
					"		TOTALDERECHOSEXPO, " +
					"		REGISTRADO_POR, " +
					"		REGISTRADO_EN, " +
					"		ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
					"	FROM V_REGISTRO1_DETEXPO %s) " +
					"WHERE R BETWEEN :1 and :2";

				if (req.query.detallada || req.query.fechaInicio || req.query.fechaFin)
					strWhere += " WHERE ";

				if (req.query.fechaInicio)
					strWhere += util.format(" FECOFI >= TO_DATE('%s', 'RRRR-MM-DD') AND ", req.query.fechaInicio);

				if (req.query.fechaFin)
					strWhere += util.format(" FECOFI <= TO_DATE('%s', 'RRRR-MM-DD') AND ", req.query.fechaFin);

				if (req.query.detallada)
					strWhere += util.format(" DETALLADA = '%s' AND ", req.query.detallada);

				strWhere = strWhere.substr(0, strWhere.length - 4);
				strSql = util.format(strSql, strWhere);

				connection.execute(strSql,[skip+1, skip+limit], function (err, data){
					if (err){
						pool.destroy(connection);
						res.status(500).json({ status:'ERROR', data: err.message });
					} else {
						strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_DETEXPO";
						if (strWhere !== '')
							strSql += util.format(" %s", strWhere);

						connection.execute(strSql, [], function (err, dataCount){
							if (err){
								pool.destroy(connection);

								res.send(500, { status:'ERROR', data: err.message });
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

// Se deja comentado el middleware ya que no tiene utilidad hasta este momento
//	router.use(function timeLog(req, res, next){
//		log.logger.info('Time registro1_detexpo: %s', Date.now());
//		next();
//	});

	router.get('/registro1_detexpo/:skip/:limit', getRegistro1DetExpo);

	return router;
};