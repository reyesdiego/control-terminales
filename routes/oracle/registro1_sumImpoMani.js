/**
 * Created by diego on 11/19/14.
 */

module.exports = function (app, log){

	var oracle = require('oracle');
	var	config = require('../../config/config.js');
	var util = require("util");

	function getRegistro1_sumimpomani( req, res){

		oracle.connect(config.oracle, function(err, connection) {
			if (err) { console.log("Error connecting to db:", err); return; }

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
				"		SUMARIA, " +
				"		SUM_ANIO, " +
				"		SUM_ADUANA, " +
				"		SUM_TIPO, " +
				"		SUM_NRO, " +
				"		SUM_LETRA_CTRL, " +
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
				"		NOMBREBUQUE, " +
				"		REGISTRADO_POR, " +
				"		REGISTRADO_EN, " +
				"		ROW_NUMBER() OVER (ORDER BY " + orderBy + ") R " +
				"	FROM V_REGISTRO1_SUMIMPOMANI %s) " +
				"WHERE R BETWEEN :1 and :2	";

			if (req.query.buque)
				strWhere += util.format(" NOMBREBUQUE = '%s' ", req.query.buque);

			strSql = util.format(strSql, strWhere);
			connection.execute(strSql,[skip+1, skip+limit], function (err, data){
				if (err){
					res.send(500, { status:'ERROR', data: err.message });
				} else {
					strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_SUMIMPOMANI ";
					if (strWhere !== '')
						strSql += util.format(" %s", strWhere);
					connection.execute(strSql, [], function (err, dataCount){
						connection.close();
						if (err){
							res.send(500, { status:'ERROR', data: err.message });
						} else {
							var total = dataCount[0].TOTAL;
							var result = {
								status:'OK',
								totalCount : total,
								page: skip,
								pageCount : (limit > total) ? total : limit,
								data: data };
							res.send(200, result);
						}
					});
				}
			});

		});
	}

	function getSumariaImpoContenedor (req, res) {
		oracle.connect(config.oracle, function(err, connection) {
			if (err) { console.log("Error connecting to db:", err); return; }

			var strWhere = '';
			var strSql = "	select sumaria, conocimiento " +
						"	from registro4_sumimpomani " +
						"	where contenedor = :1";

			connection.execute(strSql,[req.params.contenedor], function (err, dataSum){
				if (err){
					res.send(500, { status:'ERROR', data: err.message });
				} else {
					strSql = 'SELECT r1.SUMARIA, ' +
							'SUBSTR( r1.SUMARIA, 0, 2) as SUM_ANIO, ' +
							'SUBSTR( r1.SUMARIA, 3, 3) as SUM_ADUANA, ' +
							'SUBSTR( r1.SUMARIA, 6, 4) as SUM_TIPO, ' +
							'SUBSTR( r1.SUMARIA, 10, 6) as SUM_NRO, ' +
							'SUBSTR( r1.SUMARIA, 16, 1) as SUM_LETRA_CTRL, ' +
							'r2.CONOCIMIENTO, FECHAREGISTRO, FECHAARRIBO, NOMBREBUQUE BUQUE, PESO, p1.NOMBRE P_PROCEDENCIA ' +
							'FROM REGISTRO1_SUMIMPOMANI r1 ' +
							'INNER JOIN REGISTRO2_SUMIMPOMANI r2 ON r1.SUMARIA = r2.SUMARIA '+
							'INNER JOIN REGISTRO3_SUMIMPOMANI r3 ON r2.CONOCIMIENTO = r3.CONOCIMIENTO ' +
							'INNER JOIN PAISES p1 on p1.ID = PAISPROCEDENCIA ' +
							'WHERE r2.CONOCIMIENTO = :1 ';

					var result;
					if (dataSum.length > 0) {
						connection.execute(strSql,[dataSum[0].CONOCIMIENTO], function (err, data) {
							connection.close();
							result = {
								status:'OK',
								data: data };
							res.send(200, result);
						});
					} else {
						result = {
							status:'OK',
							data: [] };
						res.send(200, result);
					}
				}
			});
		});
	}

	app.get('/afip/registro1_sumimpomani/:skip/:limit', getRegistro1_sumimpomani)
	app.get('/afip/sumariaImpo/:contenedor', getSumariaImpoContenedor)
};