/**
 * Created by diego on 6/10/15.
 */

var oracledb = require('oracledb');

//oracledb.outFormat = 2;
oracledb.getConnection(
    {
        user          : "HR",
        password      : "oracle_4U",
        connectString : "(DESCRIPTION = " +
                                    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.226)(PORT = 1521)) " +
                                    "(CONNECT_DATA = " +
                                    "        (SID = ORCL) " +
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
            "SELECT department_id, department_name "
                + "FROM departments "
                + "WHERE department_id > :did",
            [0],
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