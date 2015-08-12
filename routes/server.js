/**
 * Created by diego on 3/9/15.
 */

module.exports = function (log, params) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        fs = require('fs'),
        os = require('os'),
        numWorkers,
        paramsIndex;

    router.get('/', function (req, res) {

        var util = require('util');

        numWorkers = os.cpus().length;

        var memory = process.memoryUsage();
        var heapUsed = (memory.heapUsed / 1024 / 1024).toFixed(2) + " MB";
        var heapTotal = (memory.heapTotal / 1024 / 1024).toFixed(2) + " MB";


        var osu = require("os-utils");
        //console.log(osu.freememPercentage());
        //console.log(osu.freemem());

        osu.cpuFree(function (data) {
            //console.log(data);
        });
        osu.cpuUsage(function (data) {
            //console.log(data);
        });

        paramsIndex = {
            server: params.server,
            node: {version: params.node.version, runtime: params.node.runtime, timeElapsed: params.node.timeElapsed },
            mongoose: {version: global.mongoose.version, connected: global.mongoose.connected},
            process: {cpus: numWorkers, pid: process.pid, heapUsed: heapUsed, heapTotal: heapTotal}
        };
        if (params.oracle) {
            paramsIndex.oracle = {
                pool: params.oracle.pool
            };
        }

        res.render('index', paramsIndex);

    });

    router.get('/log', function (req, res, next) {

        var filename = 'log/nohup.out';
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<html><body>');
        res.write('<br/><center><p><a name="top" style="font-size: 22px" href="#bottom">Ir a fin de pagina</a></p></center>');

        fs.exists(filename, function (exists) {
            if (exists) {
                // serve file
                var lazy = require("lazy")
                new lazy(fs.createReadStream(filename))
                    .lines
                    .forEach(function(line){
                        var n = line.toString().toUpperCase().indexOf("ERROR");
                        if (n > 0)
                            res.write("<div style='color:red'>"+ line.toString()+"</div>");
                        else
                            res.write(line.toString()+"<br/>");

                    }
                ).on('pipe', function(){
                        res.write('<center><p><a name="bottom" style="font-size: 22px" href="#top">Ir a inicio de pagina</a></p></center>');
                        res.write('</body></html>');
                        res.end();
                    });
            } else {
                res.write("<h1>No se encuentra Log</h1>");
                res.write('</body></html>');
                res.end();
            }
        });
    });

    var files=[];
    router.get('/log2', function(req, res) {
        var params,
            lazy;

        if (req.query.filename === undefined){
            log.getFiles(function (files){
                params = {
                    moment: moment,
                    json:[],
                    files: files
                };
                res.render('log', params);
            });
        } else {
            fs.exists(req.query.filename, function(exists){
                if (exists) {
                    params = {
                        moment: moment,
                        json:[],
                        filename:req.query.filename,
                        files:files
                    };
                    // serve file
                    lazy = require("lazy")
                    new lazy(fs.createReadStream(req.query.filename))
                        .lines
                        .forEach(function(line){
                            params.json.push(JSON.parse(line.toString()));
                        }
                    ).on('pipe', function(){
                            params.json.reverse();
                            res.render('log', params);
                        });
                } else {
                    res.end();
                }
            });
        }
    });

    return router;
};
