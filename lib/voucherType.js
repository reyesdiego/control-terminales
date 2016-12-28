/**
 * Created by diego on 27/12/16.
 */
"use strict";

class VoucherTypeOracle {
    constructor (connection) {
        this.cn = connection;
    }

    getAll (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql;

            if (pool) {
                pool.getConnection ((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getAll.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: err.message, data: err});
                    } else {
                        strSql = `SELECT ID, DESCRIPTION, ABBREV, TYPE
                                    FROM VOUCHER_TYPE
                                    ORDER BY DESCRIPTION`;
                        connection.execute(strSql, [], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                var vouchers;
                                if (params.type === 'array') {
                                    vouchers = {};
                                    data.rows.forEach(item => {
                                        vouchers[item.ID] = {
                                            _id: item.ID,
                                            description: item.DESCRIPTION,
                                            abbrev: item.ABBREV,
                                            type: item.TYPE
                                        };
                                    });
                                } else {
                                    vouchers = data.rows.map(item => ({
                                        _id: item.ID,
                                        description: item.DESCRIPTION,
                                        abbrev: item.ABBREV,
                                        type: item.TYPE
                                    }));
                                }

                                resolve({
                                    status: 'OK',
                                    totalCount: vouchers.length,
                                    data: vouchers
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    getByTerminal (terminal) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql;

            if (pool) {
                pool.getConnection ((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getByTerminal.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: err.message, data: err});
                    } else {
                        strSql = `SELECT ID, DESCRIPTION, ABBREV, TYPE
                                    FROM VOUCHER_TYPE
                                    WHERE ID IN (SELECT DISTINCT COD_TIPO_COMPROB
                                                FROM INVOICE_HEADER
                                                WHERE TERMINAL = :1)
                                    ORDER BY DESCRIPTION`;
                        connection.execute(strSql, [terminal], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                var vouchers;
                                vouchers = data.rows.map(item => ({
                                    _id: item.ID,
                                    description: item.DESCRIPTION,
                                    abbrev: item.ABBREV,
                                    type: item.TYPE
                                }));

                                resolve({
                                    status: 'OK',
                                    totalCount: vouchers.length,
                                    data: vouchers
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}

class VoucherTypeMongoDB {
    constructor (model) {
        this.model = model;
        this.invoice = require('../models/invoice.js');
    }

    getAll (params) {
        return new Promise((resolve, reject) => {
            var result;
            this.model.find()
                .sort({description: 1})
                .lean()
                .exec((err, data) => {
                    if (err) {
                        reject({status: "ERROR", data: err.message});
                    } else {
                        result = data;
                        if (params.type === 'array') {
                            result = {};
                            data.forEach(function (item) {
                                result[item._id] = item;
                            });
                        }
                        result = {
                            status: 'OK',
                            totalCount: data.length,
                            data: result
                        };
                        resolve(result);
                    }
                });
        });
    }

    getByTerminal (terminal) {
        return new Promise((resolve, reject) => {
            this.invoice.distinct('codTipoComprob', {terminal: terminal}, (err, data) => {
                if (err) {
                    reject({status: "ERROR", data: err.message});
                } else {
                    this.model.find({_id: {$in: data}})
                        .sort({description: 1})
                        .lean()
                        .exec((err, vouchers) => {
                            if (err) {
                                reject({status: "ERROR", data: err.message});
                            } else {
                                resolve({
                                    status: "OK",
                                    data: vouchers
                                });
                            }
                        });
                }
            });
        });
    }
}

class VoucherType {
    constructor (connection) {
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new VoucherTypeOracle(this.connection);
        } else {
            this.connection = require('../models/voucherType.js');
            this.clase = new VoucherTypeMongoDB(this.connection);
        }
    }

    getAll (params) {
        return this.clase.getAll(params);
    }

    getByTerminal (terminal) {
        return this.clase.getByTerminal(terminal);
    }
}

module.exports = VoucherType;