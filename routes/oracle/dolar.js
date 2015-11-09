/**
 * Created by diego on 11/6/15.
 */

module.exports = function (log, oracle) {
    var oracledb = require('oracledb');
    oracledb.maxRows = 2000;
//oracledb.outFormat = 2;
    oracledb.getConnection(
        {
            user          : "DIEGO",
            password      : "DIEGO888",
            connectString : "(DESCRIPTION = " +
            "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.191)(PORT = 1521)) " +
            "(CONNECT_DATA = " +
            "        (SID = PRODUC11) " +
            ") " +
            ")"
        },
        function(err, connection)
        {
            if (err) {
                console.error(err.message);
                return;
            }
            connection.execute(
//            "SELECT * FROM SIC_TESO_14 ",
                "SELECT * FROM CRE_TESO_30 ",
                [],
                {
                    // resultSet: true, // return a result set.  Default is false
                    //prefetchRows: 25 // the prefetch size can be set for each query
                },
                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    console.log("metadata: %j", result.metaData);
                    console.log("rows: %j ", result.rows[0].join("|"));
                    doRelease(connection);
                });
        });

    function doRelease(connection)
    {
        connection.release(
            function(err) {
                if (err) {
                    console.error(err.message);
                }
            });
    }
}
