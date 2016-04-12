/**
 * Created by diego on 4/6/16.
 */

var online = [];
var port = 8090;
var io;
var http = require("http");
var server = http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<!DOCTYPE "html">');
    response.write("<html>");
    response.write("<head>");
    response.write("<title>Hello World Page</title>");
    response.write("</head>");
    response.write("<body>");
    response.write("Hello World!");
    response.write("</body>");
    response.write("</html>");
    response.end();
});

function addOnline(id) {
    "use strict";
    online.push({client: id});
}

function RemoveOnline(id) {
    "use strict";
    online.forEach(function (item) {
        if (item.client === id) {
            online.splice(item, 1);
        }
    });
}

server.listen(port, function () {
    console.info("#%s Nodejs %s Running on %s://localhost:%s", process.pid, process.version, 'http', port);

    io = require('socket.io')(server, {
        transports: [
            'websocket',
            'flashsocket',
            'htmlfile',
            'xhr-polling',
            'jsonp-polling',
            'polling'
        ]
    });
    io.on('connection', function (socket) {
        console.info('Socket Client Connected: %s from: %s.', socket.id, socket.client.conn.remoteAddress);

        addOnline(socket.id);
        socket.on('sayHello', function (param1, cb) {
            console.log("Online: %s", JSON.stringify(online));
            socket.broadcast.emit('sayHello', param1);
            return cb(param1);
        });
        socket.on('disconnect', function (reason) {
            RemoveOnline(socket.id);
            console.log("Online: %s", JSON.stringify(online));
            if (reason === 'ping timeout') {
                console.info('Socket Client Disconnect (ping timeout) %s. Libera de Memoria.', socket.id);
            } else if (reason === 'transport close') {
                console.info('Socket Client Disconnect (transport close). %s. Libera de Base de Datos', socket.id);
            } else {
                console.info('Socket Client %s Disconnect. Reason: %s.', socket.id, reason);
            }
        });
    });

});
