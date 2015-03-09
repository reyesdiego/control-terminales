/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool){
	'use strict'

	var express = require('express');
	var router = express.Router();

	function getRegistro2Afectacion( req, res){

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
				"		TITULOCOMPLETO, " +
				"		NRO_LINEA, " +
				"		COD_EMBALAJE, " +
				"		TIPO_EMBALAJE, " +
				"		CANTIDAD, " +
				"		PESO, " +
				"		COMENTARIO, " +
				"		CONDICION_CONTENEDOR, " +
				"		UNIDADMEDIDA, " +
				"		TIPO_MERCADERIA, " +
				"		NUMERACIONBULTOS, " +
				"		REGISTRADO_POR, " +
				"		REGISTRADO_EN, " +
				"		ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
				"	FROM V_REGISTRO2_AFECTACION ) " +
				"WHERE R BETWEEN :1 and :2";
			if (connection){
				connection.execute(strSql,[skip+1, skip+limit], function (err, data){
					if (err){
						pool.destroy(connection);
						res.status(500).json({ status:'ERROR', data: err.message });
					} else {
						strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO2_AFECTACION";
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
								res.status(200).json(result);
							}
						});
					}
				});
			}

		});
	}

	router.use(function timeLog(req, res, next){
		log.logger.info('Time registro2_afectacion: %s', Date.now());
		next();
	});
	router.get('/registro2_afectacion/:skip/:limit', getRegistro2Afectacion);

//	app.get('/afip/registro2_afectacion/:skip/:limit', getRegistro2Afectacion)

	return router;
};