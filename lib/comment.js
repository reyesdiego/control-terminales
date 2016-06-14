/**
 * Created by diego on 09/06/16.
 */
'use strict';

var Constantes = require('./constantes.js');

class CommentOracle {
    constructor (connection) {
        this.cn = connection;
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