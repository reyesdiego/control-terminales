/**
 * Created by diego on 11/19/14.
 */

module.exports = function (app, log){

	var oracle = require('oracle');
	var	config = require('../../config/config.js');

	function getRegistro2Afectacion( req, res){

		oracle.connect(config.oracle, function(err, connection) {
			if (err) { console.log("Error connecting to db:", err); return; }

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
				"		ROW_NUMBER() OVER (ORDER BY id) R " +
				"	FROM REGISTRO2_AFECTACION ) " +
				"WHERE R BETWEEN :1 and :2";
			connection.execute(strSql,[skip+1, skip+limit], function (err, data){
				if (err){
					res.send(500, { status:'ERROR', data: err.message });
				} else {
					strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO2_AFECTACION";
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

		});
	}

	app.get('/afip/registro2_afectacion/:skip/:limit', getRegistro2Afectacion)

};
