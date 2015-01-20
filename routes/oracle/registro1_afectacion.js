/**
 * Created by diego on 11/19/14.
 */

module.exports = function (app, log){

	var oracle = require('oracle');
	var	config = require('../../config/config.js');

	function getRegistro1Afectacion( req, res){

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
					"		SUBSTR( AFECTACION, 0, 2) as	AFE_ANIO, " +
					"		SUBSTR( AFECTACION, 3, 3) as	AFE_ADUANA, " +
					"		SUBSTR( AFECTACION, 6, 4) as	AFE_TIPO, " +
					"		SUBSTR( AFECTACION, 10, 6) as	AFE_NRO, " +
					"		SUBSTR( AFECTACION, 16, 1) as	AFE_LETRA_CTRL, " +
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
					"		SUBSTR( SUMARIA, 0, 2) as	SUM_ANIO, " +
					"		SUBSTR( SUMARIA, 3, 3) as	SUM_ADUANA, " +
					"		SUBSTR( SUMARIA, 6, 4) as	SUM_TIPO, " +
					"		SUBSTR( SUMARIA, 10, 6) as	SUM_NRO, " +
					"		SUBSTR( SUMARIA, 16, 1) as	SUM_LETRA_CTRL, " +
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
					"	FROM REGISTRO1_AFECTACION ) " +
					"WHERE R BETWEEN :1 and :2";
				connection.execute(strSql, [skip+1, skip+limit], function (err, data){
					if (err){
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

			}
		});

	}

	app.get('/afip/registro1_afectacion/:skip/:limit', getRegistro1Afectacion)

};