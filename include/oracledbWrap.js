/**
 * Created by diego on 3/28/16.
 */
'use strict';

var oracledb = require('oracledb'),
//Promise = require('es6-promise').Promise,
//Promise = require('bluebird'),
    async = require('async'),
    pool,
    buildupScripts = [],
    teardownScripts = [];

module.exports.OBJECT = oracledb.OBJECT;
module.exports.oracledb = oracledb;

function createPool(config) {
    return new Promise((resolve, reject) => {
        oracledb.createPool(
            config,
            (err, p) => {
                if (err) {
                    return reject(err);
                }

                pool = p;

                resolve(pool);
            }
        );
    });
}

module.exports.createPool = createPool;

function terminatePool() {
    return new Promise((resolve, reject) => {
        if (pool) {
            pool.terminate(err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        } else {
            resolve();
        }
    });
}

module.exports.terminatePool = terminatePool;

function getPool() {
    return pool;
}

module.exports.getPool = getPool;

function addBuildupSql(statement) {
    var stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };

    buildupScripts.push(stmt);
}

module.exports.addBuildupSql = addBuildupSql;

function addTeardownSql(statement) {
    var stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };

    teardownScripts.push(stmt);
}

module.exports.addTeardownSql = addTeardownSql;

function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                return reject(err);
            }

            async.eachSeries( buildupScripts, (statement, callback) => {
                    connection.execute(statement.sql, statement.binds, statement.options, err => {
                        callback(err);
                    });
                }, err => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(connection);
                }
            );
        });
    });
}

module.exports.getConnection = getConnection;

function execute(sql, bindParams, options, connection) {
    return new Promise((resolve, reject) => {
        connection.execute(sql, bindParams, options, (err, results) => {
            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
}

module.exports.execute = execute;

function releaseConnection(connection) {
    async.eachSeries(teardownScripts, (statement, callback) => {
            connection.execute(statement.sql, statement.binds, statement.options, err => {
                callback(err);
            });
        }, err => {
            if (err) {
                console.error(err); //don't return as we still need to release the connection
            }

            connection.release(err => {
                if (err) {
                    console.error(err);
                }
            });
        }
    );
}

module.exports.releaseConnection = releaseConnection;

function simpleExecute(sql, bindParams, options) {
    options = options || {autoCommit: false, outFormat: oracledb.OBJECT};
    bindParams = bindParams || [];

    return new Promise((resolve, reject) => {
        getConnection()
            .then(connection => {
                execute(sql, bindParams, options, connection)
                    .then( results => {
                        resolve(results);

                        process.nextTick(() => {
                            releaseConnection(connection);
                        });
                    })
                    .catch(err => {
                        console.log("ERROR %s", err);
                        reject(err);
                        process.nextTick(() => {
                            releaseConnection(connection);
                        });
                    });
            })
            .catch(err => {
                console.log("ERROR %s", err);
                reject(err);
            });
    });
}

module.exports.simpleExecute = simpleExecute;