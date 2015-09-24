/**
 * Created by diego on 6/10/15.
 */

var oracledb = require('oracledb');
//oracledb.maxRows = 103;
//oracledb.outFormat = 2;

var numRows = 10;  // number of rows to return from each call to getRows()

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
        connection.execute(
            "select * FROM COUNTRIES",
            [],
            {
                resultSet: true, // return a result set.  Default is false
                prefetchRows: 25 // the prefetch size can be set for each query
            },
            function(err, result)
            {
                if (err) {
                    console.error(err.message);
                    doRelease(connection);
                    return;
                }
            //    console.log(result);
                fetchRowsFromRS(connection, result.resultSet, numRows);
//                console.log("metadata: %j", result.metaData);
  //              console.log("rows: %s, count: %j ", result.rows.length, result.rows);
    //            doRelease(connection);
            });
    });

function fetchRowsFromRS(connection, resultSet, numRows)
{
    resultSet.getRows( // get numRows rows
        numRows,
        function (err, rows)
        {
            if (err) {
                console.log(err);
                doClose(connection, resultSet); // always close the result set
            } else if (rows.length === 0) {    // no rows, or no more rows
                doClose(connection, resultSet); // always close the result set
            } else if (rows.length > 0) {
                console.log("fetchRowsFromRS(): Got " + rows.length + " rows");
                console.log(rows);
                fetchRowsFromRS(connection, resultSet, numRows);
            }
        });
}

function doRelease(connection)
{
    connection.release(
        function(err) {
            if (err) {
                console.error(err.message);
            }
        });
}

function doClose(connection, resultSet)
{
    resultSet.close(
        function(err)
        {
            if (err) { console.error(err.message); }
            doRelease(connection);
        });
}