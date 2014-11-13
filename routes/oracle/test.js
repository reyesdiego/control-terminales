/**
 * Created by diego on 11/6/14.
 */

module.exports = function (app, log){

	var oracle = require('oracle');
	var	config = require('../../config/config.js');

	function getOracleTest( req, res){

		oracle.connect(config.oracle, function(err, connection) {
			if (err) { console.log("Error connecting to db:", err); return; }

			var skip = parseInt(req.params.skip, 10);
			var limit = parseInt(req.params.limit, 10);
			var strSql = "SELECT * FROM " +
				" (SELECT id, " +
				"tiporegistro, " +
				"sumaria, " +
				"cuitata, " +
				"nombreata, " +
				"estado, " +
				"fecharegistro, " +
				"fechaarribo, " +
				"transportevacio, " +
				"paisprocedencia, " +
				"transportista, " +
				"paistransportista, " +
				"comentario, " +
				"impo_expo, " +
				"desconsolidado, " +
				"titulo, " +
				"mercaderiaabordo, " +
				"via, " +
				"nacionalidadmediotransporte, " +
				"lugaroperativo, " +
				"lugardegiro, " +
				"nombrebuque, ROW_NUMBER() OVER (ORDER BY id) R FROM REGISTRO1_SUMIMPOMANI ) " +
				" WHERE R BETWEEN :1 and :2";
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

	app.get('/oracle/test/:skip/:limit', getOracleTest)

};
