/**
 * Created by diego on 26/07/17.
 */
"use strict";

var db = require('../include/oracledbWrap.js');
var dbconfig = {
    user: "afip",
    password: "AFIP_",
    connectString: "(DESCRIPTION = " +
    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
    "(CONNECT_DATA = " +
    "        (SID = AFIP) " +
    ") " +
    ")",
    poolMax: 500,
    poolMin: 2,
    poolIncrement: 5,
    poolTimeout: 4
};

var async = require("async");
var idx = 0;
var https = require("https");

db.oracledb.maxRows = 1000;

db.createPool(dbconfig)
    .then(() => {
        //db.simpleExecute(`select distinct patenteCamion from gates where gateTimestamp >= to_date('2014-07-01','YYYY-MM-DD')`, [])
        db.simpleExecute(`select patente, gates from camiones where gates > 200 order by gates desc`, [])
            .then(data => {
                console.log(data.rows.length);

                let tasks = data.rows.map(item => ((
                    cbAsync => {
                        var options,
                            reqGet;
                        options = {
                            host: 'consultapme.cnrt.gob.ar',
                            port : 443,
                            path : `/api/vehiculo_cargas_habilitados/${item.PATENTE}/pais/AR`,
                            method : 'GET',
                            headers : {'Content-Type': 'application/json'}
                        };

                        reqGet = https.request(options, res => {
                            var resData = '';
                            res.on('data', d => {
                                resData += d;
                            });

                            res.on('error', (err) => {
                                console.error("ERROR %s", err.code);
                            });

                            res.on('end', () => {
                                var result = JSON.parse(resData);
                                cbAsync();
                                if (result.length>0) {
                                    console.log(idx++, item.PATENTE, "Sí");
                                }
                            });
                        });

                        reqGet.end(); // ejecuta el request
                    }
                )));

                async.parallel(tasks, (err, data) => {
                    console.log("TERMINO");
                });

            })
            .catch(err => {
                console.log(err);
            });
    });
