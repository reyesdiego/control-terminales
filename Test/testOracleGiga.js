/**
 * Created by diego on 7/16/15.
 */
/**
 * Created by diego on 6/10/15.
 */

var con1 =     {
    user          : "DIEGO",
    password      : "DIEGO888",
    connectString : "(DESCRIPTION = " +
    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.191)(PORT = 1521)) " +
    "(CONNECT_DATA = " +
    "        (SID = PRODUC11) " +
    ") " +
    ")"
};
var strSql1 = "SELECT * FROM CRE_TESO_30 ";

var con2 =     {
    user          : "GIGA_IIT",
    password      : "GIGA_IIT_",
    connectString : "(DESCRIPTION = " +
    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.188)(PORT = 1521)) " +
    "(CONNECT_DATA = " +
    "        (SID = PRODUC11) " +
    ") " +
    ")"
};
var strSql2 = "SELECT * FROM TARIFAS ";

var oracledb = require('oracledb');
oracledb.maxRows = 2000;
//oracledb.outFormat = 2;
oracledb.getConnection(con2,
    function(err, connection)
    {
        if (err) {
            console.error(err.message);
            return;
        }
        connection.execute(
            strSql2,
            [],
            {
                outFormat: oracledb.OBJECT
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
                console.log("data: %j", result.rows);
                //console.log("rows: %j ", result.rows[0].join("|"));
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