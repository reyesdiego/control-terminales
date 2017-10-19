/**
 * Created by diego on 13/09/17.
 */
"use strict";
var oracledb = require('oracledb');

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

        var stream = connection.queryStream(
            'SELECT * FROM registro1_remotrb'
        );

        stream.on('error', function (error) {
            // console.log("stream 'error' event");
            console.error(error);
            return;
        });

        stream.on('metadata', function (metadata) {
            // console.log("stream 'metadata' event");
            console.log(metadata);
        });

        var arr = []
        stream.on('data', function (data) {
            // console.log("stream 'data' event");
            //console.log(data);
            arr.push(data);
        });

        stream.on('end', function () {
            // console.log("stream 'end' event");
            console.log(arr.length);
            connection.close(
                function(err) {
                    if (err) {
                        console.error(err.message);
                    }
                });
        });
    });