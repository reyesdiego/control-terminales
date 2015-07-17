/**
 * Created by diego on 7/16/15.
 */
/**
 * Created by diego on 6/10/15.
 */

var oracledb = require('oracledb');

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
            {},
            function(err, result)
            {
                if (err) {
                    console.error(err.message);
                    doRelease(connection);
                    return;
                }
                console.log("metadata: %j", result.metaData);
                console.log("rows: %j ", result.rows);
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