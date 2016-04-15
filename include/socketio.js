/**
 * Created by diego on 4/12/16.
 */

module.exports = function (server, log) {
    "use strict";

    //transports: [
    //    'websocket',
    //    'flashsocket',
    //    'htmlfile',
    //    'xhr-polling',
    //    'jsonp-polling',
    //    'polling'
    //]

    var Account = require('../models/account'),
        io = require('socket.io')(server, {
            transports: [
                'websocket',
                'xhr-polling',
                'polling'
            ]
        });

    io.on('connection', function (socket) {
        log.logger.info('Socket Client Connected: %s from: %s.', socket.id, socket.client.conn.remoteAddress);

        socket.on('login', function (user, cb) {
            var logged = addOnline(socket.id, user);
            Account.findOne({user: user}, function (err, loggedUser) {
                loggedUser.lastLogin = new Date();
                loggedUser.save(function (err, userSaved) {
                    socket.broadcast.emit('loggedIn', loggedUser);
                    log.logger.info('Socket Client Logged In: %s - %s - %s.', socket.id, user, socket.client.conn.remoteAddress);

                    if (cb) {
                        return cb(logged);
                    }
                });
            });
        });

        socket.on('logoff', function (user, cb) {
            var offline = RemoveOnline(socket.id);
            Account.findOne({user: user}, function (err, loggedUser) {
                loggedUser.lastLogin = new Date();
                loggedUser.save(function (err, userSaved) {
                    socket.broadcast.emit('loggedOff', offline);
                    log.logger.info('Socket Client Logged Off: %s - %s - %s.', socket.id, user, socket.client.conn.remoteAddress);

                    if (cb) {
                        return cb(logged);
                    }
                });
            });
        });

        socket.on('newUser', function (cb) {
            console.log("newUser %s", socket.id);
            if (typeof cb === 'function') {
                return cb(socket.id);
            }
        });

        socket.on('gate', function (param) {
            socket.broadcast.emit('gate', param);
        });

        socket.on('invoice', function (param) {
            socket.broadcast.emit('invoice', param);
        });

        socket.on('appointment', function (param) {
            socket.broadcast.emit('appointment', param);
        });

        socket.on('disconnect', function (reason) {
            var offline
            if (reason === 'ping timeout') {
                log.logger.info('Socket Client Disconnect (ping timeout) %s.', socket.id);
            } else if (reason === 'transport close') {
                offline = RemoveOnline(socket.id);
                if (offline) {
                    Account.findOne({user: offline.user}, function (err, loggedUser) {
                        loggedUser.lastLogin = new Date();
                        loggedUser.save(function (err, userSaved) {
                            socket.broadcast.emit('loggedOff', offline);
                            log.logger.info('Socket Client Disconnect (transport close). %s.', socket.id);
                        });
                    });
                }
            } else {
                log.logger.info('Socket Client %s Disconnect. Reason: %s.', socket.id, reason);
            }
        });
    });

    return io;
};

function addOnline(id, user) {
    "use strict";
    var logged = {socketId: id, user: user};
    global.cache.online.push(logged);
    return logged;
}

function RemoveOnline(id) {
    "use strict";
    var i,
        item;

    for (i = 0; i <= global.cache.online.length - 1; i++) {
        item = global.cache.online[i];
        if (item.socketId === id) {
            global.cache.online.splice(i, 1);
        }
    }
    return item;
}
