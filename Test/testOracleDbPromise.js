/**
 * Created by diego on 3/29/16.
 */
'use strict';

    var Promise = require('es6-promise').Promise;

    var database = require('../include/oracledbWrap.js');

    var async = require("async");
    var util = require("util");

    var dbconfig = {
        user: "afip",
        password: "afip_",
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

    database.createPool(dbconfig)
        .then(function () {
            console.log('Se Conectó');

            console.log("ANTES %j", database.getPool());

            var express = require('express');
            var app = express();

            app.get('/', function(req, res) {
                getEmps(0);
                getEmpsII(1);
                getEmpsII(2);
                getEmpsII(3);
                getEmpsII(4);
                getEmpsII(5);
                getEmpsII(6);
                getEmps(7);
                console.log('hello world');
                res.status(200).send('hello world');
            });

            app.listen(3000);

        })
        .catch(function (err) {
            console.error('Error occurred creating database connection pool', err);
            console.log('Exiting process');
            process.exit(0);
        });

    function getEmps(cual) {

        var task,
            tasks = [];

        var strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_DETEXPO";
        task = database.simpleExecute(strSql, [], {outFormat: database.OBJECT});
        tasks.push(task);

        strSql = "SELECT * FROM REGISTRO1_DETEXPO where rownum < 3";
        task = database.simpleExecute(strSql, [], {});
        tasks.push(task);

        strSql = "SELECT * FROM REGISTRO1_DETEXPO where rownum < 3";
        task = database.simpleExecute(strSql, [], {});
        tasks.push(task);
        /*
         strSql = "SELECT * FROM REGISTRO1_DETEXPO where rownum < 3";
         task = database.simpleExecute(strSql, [], {});
         tasks.push(task);
         */
        Promise.all(tasks)
            .then( function (result) {
                console.log(result[0].rows[0].TOTAL);
                console.log(result[1].rows[0][0]);
                console.log(result[2].rows[0][0]);
                //          console.log(result[3].rows[0][0]);

                console.log("SIMPLE %d, %j", cual, database.getPool());

            })
            .catch(function (err) {
                console.log(err);
            });
    };


    function getEmpsII(cual) {

        var task,
            tasks = [];

        database.getConnection()
            .then(function (connection) {
                var strSql = "SELECT COUNT(*) AS TOTAL FROM REGISTRO1_DETEXPO";
                task = database.execute(strSql, [], {outFormat: database.OBJECT}, connection);
                tasks.push(task);

                strSql = "SELECT * FROM REGISTRO1_DETEXPO where rownum < 3";
                task = database.execute(strSql, [], {}, connection);
                tasks.push(task);

                strSql = "SELECT * FROM REGISTRO1_DETEXPO where rownum < 3";
                task = database.execute(strSql, [], {}, connection);
                tasks.push(task);

                Promise.all(tasks)
                    .then( function (result) {
                        console.log(result[0].rows[0].TOTAL);
                        console.log(result[1].rows[0][0]);
                        console.log(result[2].rows[0][0]);
                        //          console.log(result[3].rows[0][0]);

                        console.log("EXECUTE %d, %j", cual, database.getPool());

                        database.releaseConnection(connection);
                    })
                    .catch(function (err) {
                        console.log(err);
                    });

            })
            .catch(function (err) {
                console.error(err);
            });

    };
