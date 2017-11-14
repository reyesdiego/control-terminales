/**
 * Created by diego on 6/10/15.
 */

var oracledb = require('oracledb');
oracledb.maxRows = 103;
//oracledb.outFormat = 2;
oracledb.getConnection(
    {
        user          : "afip",
        password      : "afip_",
        connectString : "(DESCRIPTION = " +
        "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
        "(CONNECT_DATA = " +
        "        (SID = AFIP) " +
        ") " +
        ")"
    },
    function(err, connection)
    {
        if (err) {
            console.error(err.message);
            return;
        }



        let strSql = `
                    select * from voucher_type`;

        connection.execute(
            strSql,
            [],
            {},
            function(err, result)
            {
                if (err) {
                    console.error(err.message);
                    doRelease(connection);
                    return;
                } else {
                    console.log("metadata: %j", result);
                    //console.log("rows: %s, count: %j ", result.rows.length, result.rows);
                    doRelease(connection);
                }
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