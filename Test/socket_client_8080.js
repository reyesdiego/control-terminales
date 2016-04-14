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
        console.log('Viene de return sayHello %s', resp);
    });
    res.status(200).send("Mandó sayHello\n");
});



var io = require('socket.io-client');
var serverUrl = 'http://localhost:8090';
var conn = io.connect(serverUrl, { 'forceNew': true});

conn.on('connect', function () {
    "use strict";
    console.log("se conecto él %s", conn.id);
    //socket.disconnect();
});

 conn.on('reconnect', function() {
     "use strict";
     console.log("se RE conecto él %s", conn.id);

 });


conn.on('reconnect_error', function () {
    console.log("reconnect_error");
});
conn.on('reconnect_attempt', function (a) {
    console.log("reconnect_attempt %s", a);
});
conn.on('reconnect_failed', function (a) {
    console.log("reconnect_failed %s", a);
});


conn.on('disconnect', function() {
    console.log("CHAU");
    //socket.once('connect', function() {
    //    console.log('Connected for the second time!');
    //});
    //socket.connect();
});

conn.on('sayHello', function (param) {
    "use strict";
    console.log("llego sayHello a mi mismo  %s", param);
});
