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
			var strSql = "SELECT STREET_ADDRESS, R FROM " +
				" (SELECT STREET_ADDRESS, ROW_NUMBER() OVER (ORDER BY STREET_ADDRESS) R FROM locations) " +
				" WHERE R BETWEEN :1 and :2";
			connection.execute(strSql,[skip, skip+limit-1], function (err, data){
				connection.close();
				res.send(200, { status:'OK', data: data });
			});

		});
	}

	app.get('/oracle/test/:skip/:limit', getOracleTest)

};
