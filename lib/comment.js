/**
 * Created by diego on 09/06/16.
 */
'use strict';

var Constantes = require('./constantes.js');

class CommentOracle {
    constructor (connection) {
        this.cn = connection;
    }

    add (params, cn) {
        return new Promise((resolve, reject) => {
            var moment = require('moment');
            var pool = this.cn.pool;

            pool.getConnection((err, connection) => {
                if (err) {
                    this.cn.doRelease(connection);
                    reject({status: "ERROR", message: "Error en Oracle addComment", data: err});
                } else {
                    let strSql;
                    let param;

                    if (cn) {
                        this.cn.doRelease(connection);
                        connection = cn;
                    }

                    strSql = "insert into INVOICE_COMMENT " +
                        "(ID," +
                        "INVOICE_HEADER_ID," +
                        "TITLE," +
                        "COMENTARIO," +
                        "USR," +
                        "STATE," +
                        "GRUPO," +
                        "REGISTRADO_EN ) VALUES (" +
                        "invoices_seq.nextval, " +
                        ":INVOICE_HEADER_ID," +
                        ":TITLE, " +
                        ":COMENTARIO," +
                        ":USR," +
                        ":STATE," +
                        ":GRUPO," +
                        "to_date(:REGISTRADO_EN, 'YYYY-MM-DD HH24:MI:ss') )";
                    param = {
                        INVOICE_HEADER_ID: params.invoiceId,
                        TITLE: params.title,
                        COMENTARIO: params.comment,
                        USR: params.user,
                        STATE: params.estado,
                        GRUPO: params.group,
                        REGISTRADO_EN: moment().format("YYYY-MM-DD HH:mm:ss")
                    };
                    connection.execute(strSql, param, {autoCommit: false}, (err, resultState) => {
                        let result = {};
                        if (err) {
                            result = {
                                status: 'ERROR',
                                message: err.message,
                                data: err
                            };
                            reject(result);
                        } else {
                            if (cn) {
                                result = {
                                    status: 'OK',
                                    data: resultState
                                };
                                resolve(result);
                            } else {
                                connection.commit(() => {
                                    result = {
                                        status: 'OK',
                                        data: resultState
                                    };
                                    resolve(result);
                                });
                            }
                        }
                    });
                }
            });

        });
    }

    getComments (params, callback) {
        var context = this;
        var pool = context.cn.pool;
        var strSql;
        var result = [];

        if (pool) {
            pool.getConnection( (err, connection) => {
                if (err) {
                    context.cn.doRelease(connection);
                    if (callback) return callback({status: "ERROR", message: "Error en Oracle getComment", data: err});
                } else {
                    strSql = "select ID," +
                        "INVOICE_HEADER_ID, " +
                        "TITLE, " +
                        "COMENTARIO, " +
                        "USR, " +
                        "STATE, " +
                        "GRUPO, " +
                        "REGISTRADO_EN " +
                        "FROM INVOICE_COMMENT " +
                        "WHERE INVOICE_HEADER_ID = :1"
                    connection.execute(strSql, [params.invoice], (err, data) => {
                        if (err) {
                            context.cn.doRelease(connection);
                            callback({status: "ERROR", message: err.message});
                        } else {
                            context.cn.doRelease(connection);
                            if (data.rows.length > 0) {
                                data.rows.map((item) => {
                                    result.push({
                                        user: item.USR,
                                        invoice: item.INVOICE_HEADER_ID,
                                        comment: item.COMENTARIO,
                                        state: item.STATE,
                                        group: item.GRUPO,
                                        title: item.TITLE,
                                        registrado_en: item.REGISTRADO_EN
                                    });
                                });
                            }
                            callback(undefined, {status: "OK", data: result});
                        }
                    });
                }
            });
        }
    }

    toString() {
        return "Comment class on Oracle 11b";
    }
}

class CommentMongoDB {
    constructor (model) {
        this.model = model;
        this.Invoice = require('../models/invoice.js');
    }

    add (params) {
        return new Promise((resolve, reject) => {
            var Comment = this.model;
            var param = {
                user: params.user,
                group: params.grupo,
                title: params.title,
                comment: params.comment,
                state: params.state,
                invoice: params.invoiceId
            };

            Comment.create(param, function (err, commentInserted) {
                if (err) {
                    reject({status: "ERROR", message: err.message, data: err});
                } else {
                    this.Invoice.findOne({_id: params.invoiceId}, function (err, invoice) {
                        invoice.comment.push(commentInserted._id);
                        invoice.save(err => {
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                resolve({status: 'OK', data: commentInserted});
                            }
                        });
                    });
                }
            });
        });
    }

    getComments (params, callback) {
        var context = this;
        var terminal = params.terminal,
            invoiceId = params.invoice;

        this.Invoice.find({_id: invoiceId}, function (err, invoices) {
            var comment;
            if (err) {
                callback({status: "ERROR", data: err.message});
            } else {
                if (invoices.length > 0 && (invoices[0].terminal === terminal || terminal === 'AGP')) {
                    comment = context.model.find({invoice: invoiceId});
                    comment.sort({_id: -1});
                    comment.exec(function (err, comments) {
                        if (err) {
                            callback({status: 'ERROR', data: err});
                        } else {
                            var moment = require('moment');
                            comments.map(item => {
                                item._doc.registrado_en = moment(item._id.getTimestamp()).format('DD-MM-YYYY HH:mm:ss');
                            });
                            callback(undefined, {status: "OK", data: comments || null});
                        }
                    });
                } else {
                    callback(undefined, {status: "OK", data: null});
                }
            }
        });

    }

    toString() {
        return "Comment class on Mongo DB";
    }

}

class Comment extends Constantes {
    constructor (connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new CommentOracle(this.connection);
        } else {
            this.connection = require('../models/comment.js');
            this.clase = new CommentMongoDB(this.connection);
        }
    }

    add (params, cn) {
        return this.clase.add(params, cn);
    }

    getComments (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.getComments(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        return promise;
    }

    toString () {
        return this.clase.toString();
    }
}


module.exports = Comment;