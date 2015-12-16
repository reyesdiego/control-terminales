/**
 * Created by diego on 11/6/15.
 */

module.exports = function (log, oracle) {

    var express = require('express'),
        router = express.Router();

//    var oracledb = require('oracledb');
//    oracledb.maxRows = 2000;
//oracle.outFormat = 2;

    function getDollar(req, res) {
        var strSql;

        strSql = "SELECT ID_CRETESO30 AS ID, " +
                " CRETESO30_FECHA AS FECHA, " +
                " CRETESO30_PRECIO AS VALOR " +
                " FROM CRE_TESO_30 " +
                " WHERE CRETESO30_FECHA >= TO_DATE('2014-08-01', 'RRRR-MM-DD')" +
                " ORDER BY CRETESO30_FECHA DESC";

            oracle.oracledb.getConnection({
            user          : "DIEGO",
            password      : "DIEGO888",
            connectString : "(DESCRIPTION = " +
                "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.191)(PORT = 1521)) " +
                "(CONNECT_DATA = " +
                "        (SID = PRODUC11) " +
                ") " +
                ")"
            },
            function (err, connection) {
                if (err) {
                    log.logger.error({status: "ERROR", message: err.message});
                    doRelease(connection);
                } else {
                    connection.execute(
                        strSql,
                        [],
                        {
                            // resultSet: true, // return a result set.  Default is false
                            //prefetchRows: 25 // the prefetch size can be set for each query
                        },
                        function (err, result) {
                            if (err) {
                                console.error(err.message);
                                doRelease(connection);
                                res.status(500).send({
                                    status: "ERROR",
                                    message: err.message
                                });
                            } else {
                                doRelease(connection);
                                res.status(200).send({
                                    status: "OK",
                                    totalCount: result.rows.length,
                                    data: result.rows
                                });
                            }
                        });
                }
            });
    }

    function doRelease(connection) {
        connection.release(function (err) {
            if (err) {
                console.error(err.message);
            }
        });
    }

    router.get('/dollars', getDollar);

    return router;

}
