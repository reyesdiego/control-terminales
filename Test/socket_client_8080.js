/**
 * Created by diego on 4/12/16.
 */

/**
 * Created by diego on 4/6/16.
 */

var app = require('express')();
var server = require('http').Server(app);

server.listen(8080, function () {
    console.info("#%s Nodejs %s Running on %s://localhost:%s", process.pid, process.version, 'http', 8080);
});

app.get('/', function (req, res) {
    conn.emit('sayHello', conn.id, function (resp) {
        console.log('server sent resp code %s', resp);
    });
    res.status(200).send("Mandó sayHello\n");
});

var io = require('socket.io-client');
var serverUrl = 'http://10.10.0.223:8090';
var conn = io.connect(serverUrl, { 'forceNew': false, mio: 1});

conn.once('connect', function () {
    "use strict";
    console.log("se conecto él %s", conn.id);
    //socket.disconnect();
});
/*
 conn.once('reconnect', function() {
 "use strict";
 console.log("se RE conecto él %s", conn.id);

 conn.emit('sayHello', conn.id, function (resp) {
 console.log('server sent resp code %s', resp);
 });

 });
 */
conn.once('disconnect', function() {
    console.log("CHAU");
    //socket.once('connect', function() {
    //    console.log('Connected for the second time!');
    //});
    //socket.connect();
});

conn.on('sayHello', function (param) {
    "use strict";
    console.log("llego sayHello a cliente %s", param);
});
