/**
 * Created by diego on 11/19/14.
 */

module.exports = function (app, log, pool){

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
/*
			connection.execute(strSql, [skip+1, skip+limit], function (err, data){
				if (err){
					connection.close();
					res.send(500, { status:'ERROR', data: err.message });
				} else {
					strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_AFECTACION";
					connection.execute(strSql, [], function (err, dataCount){
						connection.close();
						if (err){
							res.send(500, { status:'ERROR', data: err.message });
						} else {
							var total = dataCount[0].TOTAL;
							var result = {
								status:'OK',
								totalCount : total,
								pageCount : (limit > total) ? total : limit,
								data: data };
							res.send(200, result);
						}
					});
				}
			});
*/
			connection.execute(strSql, [skip+1, skip+limit], function (err, data){
				if (err) {
					pool.destroy(connection);
					res.send(500, { status:'ERROR', data: err.message });

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
						res.send(500, { status:'ERROR', data: err.message });
					} else {
						var total = dataCount[0].TOTAL;
						var result = {
							status:'OK',
							totalCount : total,
							pageCount : (limit > total) ? total : limit,
							data: data };
						res.send(200, result);
					}
				});
			});
		});


/*
		oracle.connect(config.oracle, function(err, connection) {
			if (err) {
				log.logger.error("Error connecting to db: %s", err.message);
				res.send(500, {status:"ERROR", data: err.message});
			} else {
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
					if (err){
						connection.close();
						res.send(500, { status:'ERROR', data: err.message });
					} else {
						strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_AFECTACION";
						connection.execute(strSql, [], function (err, dataCount){
							//connection.close();
							if (err){
								res.send(500, { status:'ERROR', data: err.message });
							} else {
								var total = dataCount[0].TOTAL;
								var result = {
									status:'OK',
									totalCount : total,
									pageCount : (limit > total) ? total : limit,
									data: data };
								res.send(200, result);
							}
						});
					}
				});

			}
		});
*/
	}

	app.get('/afip/registro1_afectacion/:skip/:limit', getRegistro1Afectacion)

};