/**
 * Created by diego on 3/16/16.
 */

/**
 * Created by diego on 1/27/16.
 */

'use strict';

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log),
    async = require("async"),
    moment = require("moment");
var dateTime = require('../include/moment');

var oracledb = require('oracledb');
//oracledb.maxRows = 103;
//oracledb.outFormat = ;
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
    function (err, connection) {
        var strSql;
        var result = [];

        function fetchRowsFromRS(connection, resultSet, numRows) {
            resultSet.getRows( // get numRows rows
                numRows,
                function (err, rows) {
                    if (err) {
                    } else if (rows.length === 0) {  // no rows, or no more rows
                        doRelease(connection);
/*
                        result = {
                            status: "OK",
                            totalCount: result.length,
                            data: result
                        };
*/
                    console.log(result.length);

                    } else if (rows.length > 0) {
                        rows.forEach(function (item) {
                            result.push(item);
                        });
                        fetchRowsFromRS(connection, resultSet, numRows);  // get next set of rows
                    }
                });
        }

        strSql = "SELECT CONTENEDOR, FECHA_EMISION " +
            "FROM INVOICE_DETAIL INVD " +
            "INNER JOIN INVOICE_HEADER INVH ON INVD.INVOICE_HEADER_ID = INVH.ID " +
            "WHERE TERMINAL = :1 AND " +
            "       CODE IN (SELECT TT.CODE " +
            "               FROM TARIFARIO_TERMINAL TT " +
            "                   INNER JOIN TARIFARIO T ON TT.TARIFARIO_ID = T.ID " +
            "               WHERE TT.TERMINAL = INVH.TERMINAL AND RATE IS NOT NULL ) AND " +
            "   NOT EXISTS (SELECT * " +
            "        FROM GATES G " +
            "       WHERE CARGA = 'LL' AND " +
            "           G.CONTENEDOR = INVD.CONTENEDOR AND " +
            "           G.TERMINAL = INVH.TERMINAL )";
        connection.execute(strSql, ['BACTSSA'], {outFormat: oracledb.OBJECT, resultSet: true}, function (err, data) {

            if (err) {
                console.log(err);
            } else {
                fetchRowsFromRS(connection, data.resultSet, 5);
            }
        });
    });

function doRelease(connection) {
    connection.release( function (err) {
        if (err) { console.error(err.message); }
    });
}

function doClose(connection, resultSet) {
    resultSet.close( function (err) {
            if (err) { console.error(err.message); }
            doRelease(connection);
    });
}