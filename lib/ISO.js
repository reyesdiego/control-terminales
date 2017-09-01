/**
 * Created by diego on 16/06/17.
 */
"use strict";

class ISO {
    constructor (oracle) {
        this.cn = oracle;
    }

    getISO1 () {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var moment = require('moment');

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO1 in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO1", data: err});

                    } else {
                        strSql = `SELECT *
                                    FROM ISO1`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({status: "ERROR", message: err.message});
                            } else {
                                this.cn.doRelease(connection);
                                if (data.rows.length > 0) {
                                    resolve({
                                        status: "OK",
                                        data: data.rows.map(item =>
                                            ({
                                                id: item.ID,
                                                name: item.NAME
                                            }))
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    getISO2 () {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var moment = require('moment');

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO2 in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO2", data: err});

                    } else {
                        strSql = `SELECT *
                                    FROM ISO2`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({status: "ERROR", message: err.message});
                            } else {
                                this.cn.doRelease(connection);
                                if (data.rows.length > 0) {
                                    resolve({
                                        status: "OK",
                                        data: data.rows.map(item =>
                                            ({
                                                id: item.ID,
                                                name: item.NAME,
                                                tipo: item.TIPO
                                            }))
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    getISO3 () {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var moment = require('moment');

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO3 in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO3", data: err});

                    } else {
                        strSql = `SELECT *
                                    FROM ISO3`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({status: "ERROR", message: err.message});
                            } else {
                                this.cn.doRelease(connection);
                                if (data.rows.length > 0) {
                                    resolve({
                                        status: "OK",
                                        data: data.rows.map(item =>
                                            ({
                                                id: item.ID,
                                                name: item.NAME,
                                                tipo: item.TIPO,
                                                forma: item.FORMA
                                            }))
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    getISO3Formas () {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var moment = require('moment');

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO_FORMAS in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO_FORMAS", data: err});

                    } else {
                        strSql = `SELECT *
                                    FROM ISO3_FORMA`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({status: "ERROR", message: err.message});
                            } else {
                                this.cn.doRelease(connection);
                                if (data.rows.length > 0) {
                                    resolve({
                                        status: "OK",
                                        data: data.rows.map(item =>
                                            ({
                                                id: item.ID,
                                                name: item.NAME
                                            }))
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }
}


module.exports = ISO;