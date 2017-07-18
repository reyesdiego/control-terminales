/**
 * Created by diego on 6/10/15.
 */

var oracledb = require('oracledb');
//oracledb.maxRows = 100;
//oracledb.outFormat = oracledb.OBJECT;
var moment = require("moment");
var numRows = 1000;  // number of rows to return from each call to getRows()

oracledb.getConnection(
    {
        user          : "afip",
        password      : "AFIP_",
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
        //let strSql =   `SELECT DISTINCT ID1.CONTENEDOR
        //                   FROM INVOICE_DETAIL ID1
        //                       INNER JOIN INVOICE_HEADER IH1 ON ID1.INVOICE_HEADER_ID = IH1.ID
        //                   WHERE NOT EXISTS (
        //                           SELECT *
        //                           FROM INVOICE_DETAIL INVD
        //                               INNER JOIN INVOICE_HEADER INVH ON INVD.INVOICE_HEADER_ID = INVH.ID
        //                               INNER JOIN TARIFARIO_TERMINAL TT ON TT.CODE = INVD.CODE AND TT.TERMINAL = INVH.TERMINAL
        //                               INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
        //                           WHERE RATE is not null AND
        //                                   INVD.CONTENEDOR = ID1.CONTENEDOR AND
        //                                   INVH.TERMINAL = IH1.TERMINAL ) AND
        //                   IH1.TERMINAL = 'TRP' and
        //                   CONTENEDOR IS NOT NULL`;


        let strSql = `BEGIN sp_correlative(:P_TERMINAL, :P_NRO_PTO_VENTA, :P_COD_TIPO_COMPROB, :P_INICIO, :P_FIN, :RESULT_CURSOR); END;`;
//        let strSql = `BEGIN sp_correlative(:P_TERMINAL, :P_NRO_PTO_VENTA, :P_COD_TIPO_COMPROB, :RESULT_CURSOR); END;`;
        var params = {
            P_TERMINAL: "TRP",
            P_NRO_PTO_VENTA: 48,
            P_COD_TIPO_COMPROB: 1,
            P_INICIO: moment("2014-01-01", 'YYYY-MM-DD').toDate(),
            P_FIN: moment("2017-07-17", 'YYYY-MM-DD').toDate(),
            RESULT_CURSOR: {type: oracledb.CURSOR, dir: oracledb.BIND_OUT}
        };


        connection.execute(
            strSql,
            params,
            {
             //   resultSet: true, // return a result set.  Default is false
               // prefetchRows: 25 // the prefetch size can be set for each query
            },
            function(err, result)
            {
                if (err) {
                    console.error(err.message);
                    doRelease(connection);
                    return;
                }
            //    console.log(result);
                //fetchRowsFromRS(connection, result.resultSet, numRows);
                let rSet = result.outBinds.RESULT_CURSOR;
                getResultSet(connection, rSet, numRows)
                //getResultSet(connection, result.resultSet, numRows)
                .then(data => {
                        "use strict";
                        console.log("count %s", data);
                    })
                .catch(err => {
                        "use strict";
                       console.error("error %s", err);
                    });
//                console.log("metadata: %j", result.metaData);
  //              console.log("rows: %s, count: %j ", result.rows.length, result.rows);
    //            doRelease(connection);
            });
    });

function getResultSet (connection, resultSet, numRows) {
    return new Promise((resolve, reject) => {
        var ret = [];
        fetchRowsFromRS(connection, resultSet, numRows, ret, (err, ret) => {
            "use strict";
            if (err) {
                reject(err);
            } else {
                resolve(ret);
            }
        });
    });
}
function fetchRowsFromRS(connection, resultSet, numRows, ret, callback) {
    "use strict";
    resultSet.getRows( // get numRows rows
        numRows,
        function (err, rows)
        {
            if (err) {
                console.log(err);
                doClose(connection, resultSet); // always close the result set
                callback(err);
            } else if (rows.length === 0) {    // no rows, or no more rows
                doClose(connection, resultSet); // always close the result set
            } else if (rows.length > 0) {
                rows.map(item => {
                    ret.push(item[0]);
                });
                fetchRowsFromRS(connection, resultSet, numRows, ret, callback);
            }
        });
}

function doRelease(connection) {
    connection.release(err => {
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
