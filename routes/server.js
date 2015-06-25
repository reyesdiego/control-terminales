/**
 * Created by diego on 3/9/15.
 */

module.exports = function (log, app, mongoose, pool) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        moment = require('moment'),
        fs = require('fs'),
        params;

    router.get('/', function (req, res, next) {
        var connected = false;
        if (mongoose.connections.length > 0) {
            if (mongoose.connections[0]._hasOpened) {
                connected = true;
            }
        }

        var util = require('util');

        var memory = process.memoryUsage();
        var heapUsed = (memory.heapUsed / 1024 / 1024).toFixed(2) + " MB";
        var heapTotal = (memory.heapTotal / 1024 / 1024).toFixed(2) + " MB";


        params = {
            server: app.get('env'),
            node: {version: process.version, runtime: app.get('runtime'), timeElapsed: moment(app.get('runtime')).fromNow(true) },
            mongoose: {version: mongoose.version, connected: connected},
            oracle: {connectionsOpen: pool.connectionsOpen, connectionsInUse: pool.connectionsInUse},
            process: {pid: process.pid, heapUsed: heapUsed, heapTotal: heapTotal}
        };
        res.render('index', params);


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
    app.get('/log2', function(req, res) {

        if (req.query.filename === undefined){
            log.getFiles(function (files){
                var params = {
                    moment: moment,
                    json:[],
                    files: files
                };
                res.render('log', params);
            });
        } else {
            fs.exists(req.query.filename, function(exists){
                if (exists) {
                    var params = {
                        moment: moment,
                        json:[],
                        filename:req.query.filename,
                        files:files
                    };
                    // serve file
                    var lazy = require("lazy")
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
