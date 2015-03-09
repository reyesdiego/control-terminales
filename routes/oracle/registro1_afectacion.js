/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool){
	'use strict'

	var express = require('express');
	var router = express.Router();

	function getRegistro1Afectacion( req, res){

		pool.acquire(function(err, connection) {
			if (err) {
				console.log(err, "Error acquiring from pool.");
				return;
			}

			var oracleUtils = require('../../include/oracle.js')
			oracleUtils = new oracleUtils();
			var orderBy = oracleUtils.orderBy(req.query.order);

			var skip = parseInt(req.params.skip, 10);
			var limit = parseInt(req.params.limit, 10);

			var strSql = "SELECT * FROM " +
				" (SELECT " +
				"		ID, " +
				"		TIPOREGISTRO, " +
				"		AFECTACION, " +
				"		AFE_ANIO, " +
				"		AFE_ADUANA, " +
				"		AFE_TIPO, " +
				"		AFE_NRO, " +
				"		AFE_LETRA_CTRL, " +
				"		CUITATA, " +
				"		NOMBREATA, " +
				"		ESTADO, " +
				"		PROCESO, " +
				"		FECHA_REGISTRO, " +
				"		CUITIMPO, " +
				"		ADUANA_LLEGADA_SALIDA, " +
				"		PAISDESTINO, " +
				"		DIASPLAZOTRANSPORTE, " +
				"		TRANSPORTISTA, " +
				"		PAISTRANSPORTISTA, " +
				"		MOTIVOAFECTACION, " +
				"		IDENTIFICADORMOTIVOMICDTA, " +
				"		SUMARIA, " +
				"		SUM_ANIO, " +
				"		SUM_ADUANA, " +
				"		SUM_TIPO, " +
				"		SUM_NRO, " +
				"		SUM_LETRA_CTRL, " +
				"		MEDIOTRANSPORTEINTERNO, " +
				"		NACMEDIOTRANSPINTERNO, " +
				"		MATRICULAMEDIOTRANSPINTERNO, " +
				"		LUGAROPERATIVO, " +
				"		LUGARDEGIRO, " +
				"		NOMBREBUQUE, " +
				"		COMENTARIO, " +
				"		REGISTRADO_POR, " +
				"		REGISTRADO_EN, " +
				"		ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
				"	FROM V_REGISTRO1_AFECTACION ) " +
				"WHERE R BETWEEN :1 and :2";

			connection.execute(strSql, [skip+1, skip+limit], function (err, data){
				if (err) {
					pool.destroy(connection);
					res.status(500).json({ status:'ERROR', data: err.message });

					// Simply releasing this connection back to the pool means a potentially
					// corrupt connection may get reused.
//					pool.release(connection)
					// This solves the issue
//					pool.destroy(connection);

					return;
				}
				strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_AFECTACION";
				connection.execute(strSql, [], function (err, dataCount){
					pool.release(connection);
					if (err){
						res.status(500).json({ status:'ERROR', data: err.message });
					} else {
						var total = dataCount[0].TOTAL;
						var result = {
							status:'OK',
							totalCount : total,
							pageCount : (limit > total) ? total : limit,
							data: data };
						res.status(200).send(result);
					}
				});
			});
		});
	}

	router.use(function timeLog(req, res, next){
		log.logger.info('Time registro1_afectacion: %s', Date.now());
		next();
	});
	router.get('/registro1_afectacion/:skip/:limit', getRegistro1Afectacion);

//	app.get('/afip/registro1_afectacion/:skip/:limit', getRegistro1Afectacion)

	return router;
};