/**
 * Created by diego on 11/19/14.
 */

module.exports = function (log, pool){
	'use strict'

	var express = require('express');
	var router = express.Router();

	var util = require("util");

	function getRegistro3Solicitud( req, res){

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
					"		SOLICITUD, " +
					"		SOL_ANIO, " +
					"		SOL_ADUANA, " +
					"		SOL_TIPO, " +
					"		SOL_NRO, " +
					"		SOL_LETRA_CTRL, " +
					"		CONTENEDOR, " +
					"		ESTADO, " +
					"		REGISTRADO_POR, " +
					"		REGISTRADO_EN, " +
					"		ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
					"	FROM V_REGISTRO3_SOLICITUD %s ) " +
					"WHERE R BETWEEN :1 and :2";

				if (req.query.contenedor || req.query.solicitud)
					strWhere += " WHERE ";

				if (req.query.solicitud)
					strWhere += util.format(" SOLICITUD = '%s' AND ", req.query.solicitud);

				if (req.query.contenedor)
					strWhere += util.format(" CONTENEDOR = '%s' AND ", req.query.contenedor);

				strWhere = strWhere.substr(0, strWhere.length - 4);
				strSql = util.format(strSql, strWhere);

				connection.execute(strSql,[skip+1, skip+limit], function (err, data){
					if (err){
						pool.destroy(connection);
						res.status(500).json({ status:'ERROR', data: err.message });
					} else {
						strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO3_SOLICITUD";
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

// Se deja comentado el middleware ya que no tiene utilidad hasta este momento
//	router.use(function timeLog(req, res, next){
//		log.logger.info('Time registro3_solicitud: %s', Date.now());
//		next();
//	});

	router.get('/registro3_solicitud/:skip/:limit', getRegistro3Solicitud);

	return router;
};