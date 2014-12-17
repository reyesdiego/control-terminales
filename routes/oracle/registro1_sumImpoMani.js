/**
 * Created by diego on 11/19/14.
 */

module.exports = function (app, log){

	var oracle = require('oracle');
	var	config = require('../../config/config.js');
	var util = require("util");

	function getOracleTest( req, res){

		oracle.connect(config.oracle, function(err, connection) {
			if (err) { console.log("Error connecting to db:", err); return; }

			var skip = parseInt(req.params.skip, 10);
			var limit = parseInt(req.params.limit, 10);
			var strSql = "SELECT * FROM " +
				" (SELECT " +
				"		ID, " +
				"		TIPOREGISTRO, " +
				"		SUMARIA, " +
				"		SUBSTR( sumaria, 0, 2) as	ANIO, " +
				"		SUBSTR( sumaria, 3, 3) as	ADUANA, " +
				"		SUBSTR( sumaria, 6, 4) as	TIPO_SUMARIA, " +
				"		SUBSTR( sumaria, 10, 6) as	MANI_NRO, " +
				"		SUBSTR( sumaria, 16, 1) as	LETRA_CTRL, " +
				"		CUITATA, " +
				"		NOMBREATA, " +
				"		ESTADO, " +
				"		FECHAREGISTRO, " +
				"		FECHAARRIBO, " +
				"		TRANSPORTEVACIO, " +
				"		PAISPROCEDENCIA, " +
				"		TRANSPORTISTA, " +
				"		PAISTRANSPORTISTA, " +
				"		COMENTARIO, " +
				"		IMPO_EXPO, " +
				"		DESCONSOLIDADO, " +
				"		TITULO, " +
				"		MERCADERIAABORDO, " +
				"		VIA, " +
				"		NACIONALIDADMEDIOTRANSPORTE, " +
				"		LUGAROPERATIVO, " +
				"		LUGARDEGIRO, " +
				"		NOMBREBUQUE as buque, " +
				"		REGISTRADO_POR, " +
				"		REGISTRADO_EN, " +
				"		ROW_NUMBER() OVER (ORDER BY id) R " +
				"	FROM REGISTRO1_SUMIMPOMANI ) " +
				"WHERE R BETWEEN :1 and :2	";

			if (req.query.buque)
				strSql += util.format(" AND BUQUE = '%s'", req.query.buque);

			connection.execute(strSql,[skip+1, skip+limit], function (err, data){
				if (err){
					res.send(500, { status:'ERROR', data: err.message });
				} else {
					strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_SUMIMPOMANI";
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

	app.get('/afip/registro1_sumimpomani/:skip/:limit', getOracleTest)

};
