/**
 * Created by diego on 16/06/17.
 */
"use strict";

class ISO {
    constructor (oracle) {
        this.cn = oracle;
    }

    getISO1 (id) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var strWhere = '';

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO1 in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO1", data: err});

                    } else {
                        if (id) {
                            strWhere = ` WHERE ID = '${id}'`;
                        }
                        strSql = `SELECT *
                                    FROM ISO1 ${strWhere}`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message});
                            } else {
                                let result ={
                                    status: "OK"
                                };
                                let rows = data.rows.map(item =>
                                    ({
                                        id: item.ID,
                                        name: item.NAME
                                    }));

                                if (rows.length === 1 && id) {
                                    result.data = rows[0];
                                } else if (rows.length > 0) {
                                    result.data = rows;
                                } else {
                                    result.data = null;
                                }

                                resolve(result);
                            }
                        });
                    }
                });
            } else {
                console.log("%s, Error en Oracle Getting Pool", new Date());
                reject({
                    status: "ERROR",
                    message: "ORACLE POOL ERROR"
                });
            }
        });
    }

    getISO2 (id) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var strWhere = '';

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO2 in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO2", data: err});

                    } else {
                        if (id) {
                            strWhere = ` WHERE ID = '${id}'`;
                        }
                        strSql = `SELECT *
                                    FROM ISO2 ${strWhere}`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message});
                            } else {
                                let result ={
                                    status: "OK"
                                };
                                let rows = data.rows.map(item =>
                                    ({
                                        id: item.ID,
                                        name: item.NAME
                                    }));

                                if (rows.length === 1 && id) {
                                    result.data = rows[0];
                                } else if (rows.length > 0) {
                                    result.data = rows;
                                } else {
                                    result.data = null;
                                }

                                resolve(result);
                            }
                        });
                    }
                });
            } else {
                console.log("%s, Error en Oracle Getting Pool", new Date());
                reject({
                    status: "ERROR",
                    message: "ORACLE POOL ERROR"
                });
            }
        });
    }

    getISO3 (id) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var strWhere = '';

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO3 in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO3", data: err});

                    } else {
                        if (id) {
                            strWhere = ` WHERE ID = '${id}'`;
                        }
                        strSql = `SELECT *
                                    FROM ISO3 ${strWhere}`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message});
                            } else {
                                let result ={
                                    status: "OK"
                                };
                                let rows = data.rows.map(item =>
                                    ({
                                        id: item.ID,
                                        name: item.NAME,
                                        tipo: item.TIPO,
                                        forma: item.FORMA
                                    }));

                                if (rows.length === 1 && id) {
                                    result.data = rows[0];
                                } else if (rows.length > 0) {
                                    result.data = rows;
                                } else {
                                    result.data = null;
                                }

                                resolve(result);
                            }
                        });
                    }
                });
            } else {
                console.log("%s, Error en Oracle Getting Pool", new Date());
                reject({
                    status: "ERROR",
                    message: "ORACLE POOL ERROR"
                });
            }
        });
    }

    getISO3Formas (id) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var strWhere = '';

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO_FORMAS in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO_FORMAS", data: err});

                    } else {
                        if (id) {
                            strWhere = ` WHERE ID = '${id}'`;
                        }
                        strSql = `SELECT *
                                    FROM ISO3_FORMA ${strWhere}`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message});
                            } else {
                                let result ={
                                    status: "OK"
                                };
                                let rows = data.rows.map(item =>
                                    ({
                                        id: item.ID,
                                        name: item.NAME
                                    }));

                                if (rows.length === 1 && id) {
                                    result.data = rows[0];
                                } else if (rows.length > 0) {
                                    result.data = rows;
                                } else {
                                    result.data = null;
                                }

                                resolve(result);
                            }
                        });
                    }
                });
            } else {
                console.log("%s, Error en Oracle Getting Pool", new Date());
                reject({
                    status: "ERROR",
                    message: "ORACLE POOL ERROR"
                });
            }
        });
    }

    getISO4 (id) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';
            var strWhere = '';

            if (pool) {
                pool.getConnection ((err, connection ) => {
                    if (err) {
                        console.log("%s, Error en Oracle Getting ISO4 in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle ISO4", data: err});

                    } else {
                        strSql = `SELECT *
                                    FROM ISO4 ${strWhere}`;
                        connection.execute(strSql, {}, {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message});
                            } else {
                                let result ={
                                    status: "OK"
                                };
                                let rows = data.rows.map(item =>
                                    ({
                                        id: item.ID,
                                        name: item.NAME
                                    }));

                                if (rows.length === 1 && id) {
                                    result.data = rows[0];
                                } else if (rows.length > 0) {
                                    result.data = rows;
                                } else {
                                    result.data = null;
                                }

                                resolve(result);
                            }
                        });
                    }
                });
            } else {
                console.log("%s, Error en Oracle Getting Pool", new Date());
                reject({
                    status: "ERROR",
                    message: "ORACLE POOL ERROR"
                });
            }
        });
    }

    getISO (iso) {
        return new Promise((resolve, reject) => {
            var tasks = [];
            var async = require("async");

            if (iso && iso.length !== 4) {
                reject({
                    status: "ERROR",
                    message: "El ISO ingresado debe tener 4 caracteres"
                });
            } else {

                tasks.push( callback => {
                    this.getISO1(iso.substr(0, 1))
                        .then(data => {
                            callback(undefined, data.data);
                        })
                        .catch(err => {
                            callback(err);
                        });
                });
                tasks.push( callback => {
                    this.getISO2(iso.substr(1, 1))
                        .then(data => {
                            callback(undefined, data.data);
                        })
                        .catch(err => {
                            callback(err);
                        });
                });
                tasks.push( callback => {
                    this.getISO3(iso.substr(2, 1))
                        .then(data => {
                            callback(undefined, data.data);
                        })
                        .catch(err => {
                            callback(err);
                        });
                });
                tasks.push( callback => {
                    this.getISO4(iso.substr(3, 1))
                        .then(data => {
                            callback(undefined, data.data);
                        })
                        .catch(err => {
                            callback(err);
                        });
                });

                async.parallel(tasks, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    console.log(data[0], err);
                    console.log(data[0].data, data[1].data, data[2].data, data[3].data);
                    resolve({
                        status: "OK",
                        data: {
                            iso1: data[0].data,
                            iso2: data[1].data,
                            iso3: data[2].data,
                            iso4: data[3].data
                        }
                    });
                });

            }

        });
    }
}


module.exports = ISO;