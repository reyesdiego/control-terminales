/**
 * Created by diego on 11/19/14.
 */

module.exports = function (app, log){

	var oracle = require('oracle');
	var	config = require('../../config/config.js');

	function getRegistro1Afectacion( req, res){

		oracle.connect(config.oracle, function(err, connection) {
			if (err) { console.log("Error connecting to db:", err); return; }

			var skip = parseInt(req.params.skip, 10);
			var limit = parseInt(req.params.limit, 10);
			var strSql = "SELECT * FROM " +
				" (SELECT " +
				"		ID, " +
				"		TIPOREGISTRO, " +
				"		AFECTACION, " +
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
				"		MEDIOTRANSPORTEINTERNO, " +
				"		NACMEDIOTRANSPINTERNO, " +
				"		MATRICULAMEDIOTRANSPINTERNO, " +
				"		LUGAROPERATIVO, " +
				"		LUGARDEGIRO, " +
				"		NOMBREBUQUE, " +
				"		COMENTARIO, " +
				"		REGISTRADO_POR, " +
				"		REGISTRADO_EN, " +
				"		ROW_NUMBER() OVER (ORDER BY id) R " +
				"	FROM REGISTRO1_AFECTACION ) " +
				"WHERE R BETWEEN :1 and :2";
			connection.execute(strSql,[skip+1, skip+limit], function (err, data){
				connection.close();
				if (err){
					res.send(500, { status:'ERROR', data: err.message });
				} else {
					res.send(200, { status:'OK', data: data });
				}
			});

		});
	}

	app.get('/afip/registro1_afectacion/:skip/:limit', getRegistro1Afectacion)

};