/**
 * Created by diego on 11/19/14.
 */

module.exports = function (app, log){

	var oracle = require('oracle');
	var	config = require('../../config/config.js');

	function getRegistro3DetImpo( req, res){

		oracle.connect(config.oracle, function(err, connection) {
			if (err) { console.log("Error connecting to db:", err); return; }

			var skip = parseInt(req.params.skip, 10);
			var limit = parseInt(req.params.limit, 10);
			var strSql = "SELECT * FROM " +
				" (SELECT " +
				"		ID, " +
				"		TIPOREGISTRO, " +
				"		DETALLADA, " +
				"		NRO_ITEM, " +
				"		POSICIONARANCELARIA, " +
				"		ESTADO_MERCA, " +
				"		PAIS_ORIGEN, " +
				"		PAIS_PROCEDENCIA, " +
				"		UNIDAD_DECLARADA, " +
				"		CANTIDAD_UNIDAD_DECLARADA, " +
				"		BASEIMPONIBLEDOLARES, " +
				"		UNIDAD_ESTADISTICA, " +
				"		CANTIDAD_UNIDADES_ESTAD, " +
				"		REGISTRADO_POR, " +
				"		REGISTRADO_EN, " +
				"		ROW_NUMBER() OVER (ORDER BY id) R " +
				"	FROM REGISTRO3_DETIMPO) " +
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

	app.get('/afip/registro3_detimpo/:skip/:limit', getRegistro3DetImpo)

};
