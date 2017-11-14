/**
 * Created by diego on 29/08/16.
 */
var http = require('http'),
    fs = require('fs'),
    util = require('util');

var express = require("express");
var app = express();

app.get('/', (req, res) => {
    //var path = 'small.mp4';
    var path = 'Video1.mov';
    var stat = fs.statSync(path);
    var total = stat.size;
    if (req.headers['range']) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total-1;
        var chunksize = (end-start)+1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        var file = fs.createReadStream(path, {start: start, end: end});
        res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
        file.pipe(res);
    } else {
        console.log('ALL: ' + total);
        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
        fs.createReadStream(path).pipe(res);
    }
});

app.all('/*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", 'X-Requested-With, Content-Type, token');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Request-Headers', 'Content-Type, token');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if ('OPTIONS' === req.method) {
        res.status(200).send();
    } else {
        next();
    }
});

var server = http.createServer(app);

server.listen(1337);

//http.createServer(function (req, res) {
//    //var path = 'small.mp4';
//    var path = 'Video1.mov';
//    var stat = fs.statSync(path);
//    var total = stat.size;
//    if (req.headers['range']) {
//        var range = req.headers.range;
//        var parts = range.replace(/bytes=/, "").split("-");
//        var partialstart = parts[0];
//        var partialend = parts[1];
//
//        var start = parseInt(partialstart, 10);
//        var end = partialend ? parseInt(partialend, 10) : total-1;
//        var chunksize = (end-start)+1;
//        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);
//
//        var file = fs.createReadStream(path, {start: start, end: end});
//        res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
//        file.pipe(res);
//    } else {
//        console.log('ALL: ' + total);
//        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
//        fs.createReadStream(path).pipe(res);
//    }
//}).listen(8099, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');