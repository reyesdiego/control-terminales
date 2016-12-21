/**
 * Created by diego on 2/12/16.
 */
"use strict";

function getResultSet (connection, resultSet, numRows) {
    return new Promise((resolve, reject) => {
        var ret = [];
        fetchRowsFromRS(connection, resultSet, numRows, ret, (err, ret) => {
            if (err) {
                reject(err);
            } else {
                resolve(ret);
            }
        });
    });
}

function fetchRowsFromRS(connection, resultSet, numRows, ret, callback) {
    resultSet.getRows(numRows, (err, rows) => {
            if (err) {
                callback(err);
            } else if (rows.length === 0) {    // no rows, or no more rows
                callback(undefined, ret);
            } else if (rows.length > 0) {
                rows.map(item => {
                    ret.push(item);
                });
                fetchRowsFromRS(connection, resultSet, numRows, ret, callback);
            }
        });
}

var Constantes = require('./constantes.js');

class InvoiceOracle {
    constructor (oracle) {
        this.cn = oracle;
    }

    add (invoice, io, callback) {
        var self = this;
        var pool = self.cn.pool;
        let strSql,
            param,
            usr,
            tasks = [],
            task,
            taskComment;
        var moment = require('moment');
        var util = require('util');
        var _autoCommit = false;
        var async = require('async');

        if (pool) {
            pool.getConnection ((err, connection ) => {
                if (err) {
                    self.cn.doRelease(connection);
                    console.log("%s, Error en Oracle Adding Invoice in OracleDb.", new Date());
                    if (callback) return callback({status: "ERROR", message: "Error en Oracle addInvoice", data: err});

                } else {
                    usr = invoice.usr;
                    delete invoice.usr;

                    strSql = "insert into INVOICE_HEADER " +
                        "(ID, " +
                        "TERMINAL, " +
                        "TIPO, " +
                        "COD_TIPO_COMPROB, " +
                        "NRO_PTO_VENTA, " +
                        "NRO_COMPROB, " +
                        "COD_TIPO_AUTORIZ, " +
                        "COD_AUTORIZ, " +
                        "COD_TIPO_DOC, " +
                        "NRO_DOC, " +
                        "CLIENT_ID, " +
                        "RAZON, " +
                        "IMPORTE_GRAVADO, " +
                        "IMPORTE_NO_GRAVADO, " +
                        "IMPORTE_EXENTO, " +
                        "IMPORTE_IVA, " +
                        "IMPORTE_SUBTOTAL, " +
                        "IMPORTE_OTROS_TRIBUTOS, " +
                        "IMPORTE_TOTAL, " +
                        "TOTAL, " +
                        "COD_MONEDA, " +
                        "COTI_MONEDA, " +
                        "OBSERVA, " +
                        "COD_CONCEPTO, " +
                        "FECHA_EMISION, " +
                        "FECHA_VCTO, " +
                        "FECHA_DESDE, " +
                        "FECHA_HASTA, " +
                        "FECHA_VCTO_PAGO, " +
                        "RESEND," +
                        "REGISTRADO_EN" +
                        ") VALUES (" +
                        "invoices_seq.nextval, " +
                        ":terminal, " +
                        ":tipo, " +
                        ":codTipoComprob, " +
                        ":nroPtoVenta, " +
                        ":nroComprob, " +
                        ":codTipoAutoriz, " +
                        ":codAutoriz, " +
                        ":codTipoDoc," +
                        ":nroDoc, " +
                        ":clientId, " +
                        ":razon, " +
                        ":importeGravado, " +
                        ":importeNoGravado, " +
                        ":importeExento, " +
                        ":importeIva, " +
                        ":importeSubtotal, " +
                        ":importeOtrosTributos, " +
                        ":importeTotal, " +
                        ":total, " +
                        ":codMoneda," +
                        ":cotiMoneda," +
                        ":observa, " +
                        ":codConcepto," +
                        "to_date(:fechaEmision, 'YYYY-MM-DD')," +
                        "to_date(:fechaVcto, 'YYYY-MM-DD')," +
                        "to_date(:fechaDesde, 'YYYY-MM-DD')," +
                        "to_date(:fechaHasta, 'YYYY-MM-DD')," +
                        "to_date(:fechaVctoPago, 'YYYY-MM-DD'), " +
                        ":resend," +
                        "to_date(:registrado_en, 'YYYY-MM-DD HH24:MI:SS') " +
                        ") RETURNING ID INTO :outputId";
                    param = {
                        outputId : {type: self.cn.oracledb.NUMBER, dir: self.cn.oracledb.BIND_OUT},
                        terminal: usr.terminal,
                        tipo: invoice.tipo,
                        codTipoComprob: parseInt(invoice.codTipoComprob.toString().trim(), 10),
                        nroPtoVenta: invoice.nroPtoVenta,
                        nroComprob: invoice.nroComprob,
                        codTipoAutoriz: invoice.codTipoAutoriz,
                        codAutoriz: invoice.codAutoriz,
                        codTipoDoc: invoice.codTipoDoc,
                        nroDoc: invoice.nroDoc,
                        clientId: invoice.clientId,
                        razon: invoice.razon.trim(),
                        importeGravado: Math.abs(invoice.impGrav),
                        importeNoGravado: Math.abs(invoice.impNoGrav),
                        importeExento: Math.abs(invoice.impExento),
                        importeIva: Math.abs(invoice.impIva),
                        importeSubtotal: Math.abs(invoice.impSubtot),
                        importeOtrosTributos: invoice.impOtrosTrib,
                        importeTotal: Math.abs(invoice.impTotal),
                        codMoneda: invoice.codMoneda,
                        cotiMoneda: invoice.cotiMoneda,
                        observa: invoice.observa,
                        codConcepto: invoice.codConcepto,
                        fechaEmision: moment(invoice.fechaEmision, "YYYY-MM-DD").format("YYYY-MM-DD"),
                        fechaVcto: moment(invoice.fechaVcto, "YYYY-MM-DD").format("YYYY-MM-DD"),
                        fechaDesde: moment(invoice.fechaServDesde, "YYYY-MM-DD").format("YYYY-MM-DD"),
                        fechaHasta: moment(invoice.fechaServHasta, "YYYY-MM-DD").format("YYYY-MM-DD"),
                        fechaVctoPago: moment(invoice.fechaVctoPago, "YYYY-MM-DD").format("YYYY-MM-DD"),
                        resend: invoice.resend,
                        registrado_en: moment().format("YYYY-MM-DD HH:mm:ss")
                    };

                    var strVoucher = "SELECT TYPE FROM VOUCHER_TYPE WHERE ID = :1";
                    connection.execute(strVoucher, [param.codTipoComprob], {}, (err, result) => {
                        var voucherType = result.rows[0];

                            param.total = param.importeTotal * param.cotiMoneda * voucherType.TYPE;

                            connection.execute(strSql, param, {autoCommit: _autoCommit}, (err, result) => {
                                let error;
                                if (err) {
                                    error = self.cn.error(err);
                                    error.data = invoice;
                                    if (error.code === 'ORA-00001') {
                                        strSql = "SELECT RESEND FROM INVOICE_HEADER " +
                                            "WHERE NRO_COMPROB = " + param.nroComprob + " AND " +
                                            "   COD_TIPO_COMPROB = " + param.codTipoComprob + " AND " +
                                            "   TERMINAL = '" + param.terminal + "' AND " +
                                            "   NRO_PTO_VENTA = " + param.nroPtoVenta;
                                        connection.execute(strSql, [], {}, (errResend, data) => {

                                            if (errResend) {
                                                self.cn.doRelease(connection);
                                                if (callback) return callback({status: "ERROR", message: "Adding Invoice in OracleDb", data: error});
                                            } else {
                                                if (data.rows[0].RESEND === 1) {
                                                    strSql = "DELETE FROM INVOICE_HEADER " +
                                                        "WHERE NRO_COMPROB = " + param.nroComprob + " AND " +
                                                        "   COD_TIPO_COMPROB = " + param.codTipoComprob + " AND " +
                                                        "   TERMINAL = '" + param.terminal + "' AND " +
                                                        "   NRO_PTO_VENTA = " + param.nroPtoVenta;
                                                    connection.execute(strSql, [], {autoCommit: true}, (err) => {
                                                        if (err) {
                                                            self.cn.doRelease(connection);
                                                            if (callback) return callback({status: "ERROR", message: "Adding Invoice in OracleDb", data: error});
                                                        } else {
                                                            self.add(invoice, io, callback);
                                                        }

                                                    });
                                                } else {
                                                    self.cn.doRelease(connection);
                                                    if (callback) return callback({status: "ERROR", message: error.message, data: error.data});
                                                }
                                            }
                                        });
                                    } else {
                                        self.cn.doRelease(connection);
                                        if (callback) return callback({status: "ERROR", message: error.message, data: error.data});
                                    }
                                } else {
                                    let subTotalCheck = 0,
                                        estado = 'Y';
                                    var comment = 'Comprobante transferido correctamente.';
                                    var commentState = 'Y';

                                    param._id = result.outBinds.outputId[0];

                                    //Verifica que haya Detalle, sino retorna ERROR
                                    if (invoice.detalle && invoice.detalle.length > 0) {

                                        invoice.detalle.forEach(detalle => {
                                            //Verifica que haya Items en el Detalle, sino retorna ERROR
                                            if (detalle.items && detalle.items.length>0) {
                                                detalle.items.forEach(item => {
                                                    subTotalCheck += Math.abs(item.impTot);

                                                    task = (callbackDetail) => {
                                                        let param;
                                                        strSql = "insert into INVOICE_DETAIL " +
                                                            "(ID," +
                                                            "INVOICE_HEADER_ID," +
                                                            "CONTENEDOR," +
                                                            "IMO," +
                                                            "BUQUE_CODIGO," +
                                                            "BUQUE_NOMBRE," +
                                                            "BUQUE_VIAJE," +
                                                            "BUQUE_FECHA," +
                                                            "CODE," +
                                                            "CNT," +
                                                            "UNI_MED," +
                                                            "IMP_UNIT," +
                                                            "IMP_TOT" +
                                                            ") VALUES (" +
                                                            "invoices_seq.nextval," +
                                                            ":INVOICE_HEADER_ID, " +
                                                            ":CONTENEDOR, " +
                                                            ":IMO, " +
                                                            ":BUQUE_CODIGO, " +
                                                            ":BUQUE_NOMBRE, " +
                                                            ":VIAJE, " +
                                                            ":FECHA," +
                                                            ":CODE, " +
                                                            ":CNT, " +
                                                            ":UNIMED," +
                                                            ":IMPUNIT, " +
                                                            ":IMPTOT)";

                                                        let buqueId = (detalle.buqueId !== undefined && detalle.buqueId !== null) ? detalle.buqueId.toString() : "";
                                                        let buqueDesc = (detalle.buqueDesc !== undefined && detalle.buqueDesc !== null) ? detalle.buqueDesc.trim() : "";
                                                        let viaje = (detalle.viaje !== undefined && detalle.viaje !== null) ? detalle.viaje.trim() : "";
                                                        let fecha = (detalle.fecha !== undefined && detalle.fecha !== "" && detalle.fecha != null) ? moment(detalle.fecha, "YYYY-MM-DD") : "";

                                                        param = {
                                                            INVOICE_HEADER_ID: result.outBinds.outputId[0],
                                                            CONTENEDOR: (detalle.contenedor) ? detalle.contenedor.trim() : "",
                                                            IMO: (detalle.IMO !== undefined) ? detalle.IMO : 0,
                                                            BUQUE_CODIGO: buqueId,
                                                            BUQUE_NOMBRE: buqueDesc,
                                                            VIAJE: viaje,
                                                            FECHA: fecha,
                                                            CODE: item.id,
                                                            IMPUNIT: item.impUnit,
                                                            IMPTOT: Math.abs(item.impTot),
                                                            UNIMED: item.uniMed,
                                                            CNT: Math.abs(item.cnt)
                                                        };
                                                        connection.execute(strSql, param, {autoCommit: _autoCommit}, (err, resultDetail) => {
                                                            if (err) {
                                                                callbackDetail(self.cn.error(err));
                                                            } else {
                                                                callbackDetail(undefined, resultDetail);
                                                            }
                                                        });
                                                    };
                                                    tasks.push(task);
                                                });
                                            } else {
                                                self.cn.doRelease(connection);
                                                //Verifica que haya Items en el Detalle, sino retorna ERROR
                                                let errMsg = util.format("El contenedor no posee items. %s, %j",  usr.terminal, invoice);
                                                if (callback) return callback({
                                                    status: "ERROR",
                                                    message: errMsg,
                                                    data: invoice
                                                });
                                            }
                                        });
                                    } else {
                                        self.cn.doRelease(connection);
                                        //Verifica que haya Detalle, sino retorna ERROR
                                        let errMsg = util.format("El Comprobante no posee Detalles. %s, %j", usr.terminal, invoice);
                                        if (callback) return callback({
                                            status: "ERROR",
                                            message: errMsg,
                                            data: invoice
                                        });
                                    }

                                    if ((subTotalCheck > invoice.impSubtot + 2) || (subTotalCheck < invoice.impSubtot - 2)) {
                                        comment = util.format("El subtotal del comprobante es incorrecto, la suma es %d y se informa %d. - %s.", subTotalCheck, invoice.impSubtot, usr.terminal);
                                        estado = 'T';
                                    }

                                    /**Agrega Comentario al Comprobante*/
                                    taskComment = callbackComment => {
                                        let Comment = require('../lib/comment.js');
                                        Comment = new Comment(this.cn);

                                        let param;
                                        param = {
                                            invoiceId: result.outBinds.outputId[0],
                                            title: 'Transferencia comprobante.',
                                            comment: comment,
                                            user: usr.user,
                                            estado: commentState,
                                            group: "ALL"
                                        };
                                        Comment.add(param, connection)
                                        .then(data => {
                                                callbackComment(undefined, data);
                                            })
                                        .catch(err => {
                                                callbackComment(self.cn.error(err));
                                            });
                                    };
                                    tasks.push(taskComment);

                                    /**Agrega Estado al Comprobante*/
                                    task = callbackState => {
                                        let param = {
                                            invoiceId: result.outBinds.outputId[0],
                                            user: usr.user,
                                            estado: estado,
                                            group: "ALL"
                                        };
                                        this.addState(param, connection)
                                        .then(data => {
                                                callbackState(undefined, data);
                                            })
                                        .catch(err => {
                                                callbackState(self.cn.error(err));
                                            });
                                    };
                                    tasks.push(task);

                                    async.parallel(tasks, function (err, data) {
                                        if (err) {
                                            connection.rollback(errRollback => {
                                                self.cn.doRelease(connection);
                                                if (callback) return callback({
                                                    status: "ERROR",
                                                    data: self.cn.error(err)
                                                });
                                            });
                                        } else {
                                            connection.commit(errCommit => {
                                                self.cn.doRelease(connection);
                                                if (errCommit) {
                                                    if (callback) return callback({
                                                        status: "ERROR",
                                                        data: self.cn.error(errCommit)
                                                    });
                                                } else {
                                                    if (callback) return callback(undefined, {
                                                        status: "OK", data: param
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        });

                }
            });
        }
    }

    addState (params, cn) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;

            pool.getConnection((err, connection) => {
                if (err) {
                    this.cn.doRelease(connection);
                    reject({status: "ERROR", message: "Error en Oracle addState", data: err});
                } else {
                    let strSql;
                    let param;

                    if (cn) {
                        this.cn.doRelease(connection);
                        connection = cn;
                    }

                    strSql = `insert into INVOICE_STATE (
                                ID,
                                INVOICE_HEADER_ID,
                                USR,
                                GRUPO,
                                STATE ) VALUES (
                                invoices_seq.nextval,
                                :INVOICE_HEADER_ID,
                                :USR,
                                :GRUPO,
                                :STATE )`;

                    param = {
                        INVOICE_HEADER_ID: params.invoiceId,
                        USR: params.user,
                        STATE: params.estado,
                        GRUPO: params.group
                    };
                    connection.execute(strSql, param, {autoCommit: false}, (err, resultState) => {
                        let result = {};
                        if (err) {
                            if (cn === undefined) {
                                this.cn.doRelease(connection);
                            }
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
                                    this.cn.doRelease(connection);
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

    getInvoice (params) {
        return new Promise((resolve, reject) => {
            var self = this;
            var moment = require('moment');
            var pool = self.cn.pool;
            var strSql;
            var tasksAsync = [],
                taskAsync,
                async = require('async'),
                Enumerable = require('linq');

            if (pool) {
                taskAsync = function (asyncCallback) {
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            console.log("%s, Error en Oracle getInvoice.", new Date());
                            self.cn.doRelease(connection);
                            if (callback) return callback({status: "ERROR", message: "Error en Oracle getInvoice", data: err});
                        } else {

                            strSql = `SELECT ID,
                                       TERMINAL,
                                       COD_TIPO_COMPROB,
                                       NRO_PTO_VENTA,
                                       NRO_COMPROB,
                                       COD_TIPO_AUTORIZ,
                                       COD_AUTORIZ,
                                       COD_TIPO_DOC,
                                       NRO_DOC,
                                       CLIENT_ID,
                                       RAZON,
                                       IMPORTE_GRAVADO,
                                       IMPORTE_NO_GRAVADO,
                                       IMPORTE_EXENTO,
                                       IMPORTE_IVA,
                                       IMPORTE_SUBTOTAL,
                                       IMPORTE_OTROS_TRIBUTOS,
                                       IMPORTE_TOTAL,
                                       TOTAL,
                                       COD_MONEDA,
                                       COTI_MONEDA,
                                       OBSERVA,
                                       COD_CONCEPTO,
                                       FECHA_EMISION,
                                       FECHA_VCTO,
                                       FECHA_DESDE,
                                       FECHA_HASTA,
                                       FECHA_VCTO_PAGO,
                                       RESEND,
                                       REGISTRADO_EN
                                 FROM INVOICE_HEADER
                                 WHERE ID = :1`;
                            connection.execute(strSql, [params._id], {}, function (err, data) {
                                self.cn.doRelease(connection);
                                if (err) {
                                    return asyncCallback(err);
                                } else {
                                    if (data.rows) {
                                        data = data.rows.map(function (item) {
                                            return {
                                                _id: item.ID,
                                                terminal: item.TERMINAL,
                                                codTipoComprob: item.COD_TIPO_COMPROB,
                                                nroPtoVenta: item.NRO_PTO_VENTA,
                                                nroComprob: item.NRO_COMPROB,
                                                codTipoAutoriz: item.COD_TIPO_AUTORIZ,
                                                codAutoriz: item.COD_AUTORIZ,
                                                codTipoDoc: item.COD_TIPO_DOC,
                                                nroDoc: item.NRO_DOC,
                                                client_id: item.client_id,
                                                razon: item.RAZON,
                                                importe: {
                                                    gravado: item.IMPORTE_GRAVADO,
                                                    noGravado: item.IMPORTE_NO_GRAVADO,
                                                    exento: item.IMPORTE_EXENTO,
                                                    subtotal: item.IMPORTE_SUBTOTAL,
                                                    iva: item.IMPORTE_IVA,
                                                    importe_otros_tributos: item.IMPORTE_OTROS_TRIBUTOS,
                                                    total: item.IMPORTE_TOTAL
                                                },
                                                total: item.TOTAL,
                                                codMoneda: item.COD_MONEDA,
                                                cotiMoneda: item.COTI_MONEDA,
                                                observa: item.OBSERVA,
                                                codConcepto: item.COD_CONCEPTO,
                                                fecha: {
                                                    emision: item.FECHA_EMISION,
                                                    vcto: item.FECHA_VCTO,
                                                    desde: item.FECHA_DESDE,
                                                    hasta: item.FECHA_HASTA,
                                                    vctoPago: item.FECHA_VCTO_PAGO
                                                },
                                                comments: [],
                                                estado: [
                                                    {
                                                        "grupo": "ALL",
                                                        "user": "t4",
                                                        "estado": "Y"
                                                    }
                                                ],
                                                otrosTributos: [],
                                                resend: item.RESEND,
                                                registrado_en: item.REGISTRADO_EN
                                            };
                                        });
                                    }
                                    return asyncCallback(undefined, data[0]);
                                }
                            });
                        }
                    });
                };
                tasksAsync.push(taskAsync);
                taskAsync = function (asyncCallback) {
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            console.log("%s, Error en Oracle getInvoice.", new Date());
                            self.cn.doRelease(connection);
                            if (callback) return callback({status: "ERROR", message: "Error en Oracle getInvoice", data: err});
                        } else {

                            strSql = "SELECT ID, " +
                                "INVOICE_HEADER_ID, " +
                                "CONTENEDOR, " +
                                "IMO, " +
                                "BUQUE_CODIGO, " +
                                "BUQUE_NOMBRE, " +
                                "BUQUE_VIAJE, " +
                                "BUQUE_FECHA, " +
                                "CODE, " +
                                "CNT, " +
                                "UNI_MED, " +
                                "IMP_UNIT, " +
                                "IMP_TOT " +
                                "FROM INVOICE_DETAIL " +
                                " WHERE INVOICE_HEADER_ID = :1";
                            connection.execute(strSql, [params._id], {}, function (err, data) {
                                self.cn.doRelease(connection);
                                if (err) {
                                    return asyncCallback(err);
                                } else {
                                    if (data.rows) {
                                        var deta1 = Enumerable.from(data.rows)
                                            .groupBy('x=>JSON.stringify({' +
                                            'CONTENEDOR: x.CONTENEDOR, ' +
                                            'BUQUE_NOMBRE: x.BUQUE_NOMBRE, ' +
                                            'BUQUE_VIAJE: x.BUQUE_VIAJE,' +
                                            'BUQUE_FECHA: x.BUQUE_FECHA})', null, (key, g) => {
                                                key = JSON.parse(key);
                                                var deta = {
                                                    contenedor: key.CONTENEDOR,
                                                    buque: {
                                                        nombre: key.BUQUE_NOMBRE,
                                                        viaje: key.BUQUE_VIAJE,
                                                        fecha: key.BUQUE_FECHA
                                                    }
                                                };
                                                var items = Enumerable.from(g.getSource())
                                                    .select((item) => {
                                                        return {
                                                            id: item.CODE,
                                                            cnt: item.CNT,
                                                            impTot: item.IMP_TOT,
                                                            impUnit: item.IMP_UNIT,
                                                            uniMed: item.UNI_MED
                                                        };
                                                    }).toArray();
                                                deta.items = items;
                                                return deta;
                                            }).toArray();
                                    }
                                    return asyncCallback(undefined, deta1);
                                }
                            });
                        }
                    });
                };
                tasksAsync.push(taskAsync);

                async.parallel(tasksAsync, function (err, data) {
                    var header = data[0];
                    var details = data[1];
                    var result;

                    if (err) {
                        result = {
                            status: "ERROR",
                            message: err.message,
                            data: err
                        };
                        reject(result);
                    } else {
                        if (header !== undefined) {
                            header.detalle = details;
                        }
                        result = {
                            status: 'OK',
                            data: header || null
                        };
                        resolve(result);
                    }
                });
            }
        });
    }

    getInvoices (params, callback) {

        var pool = this.cn.pool;
        var async = require('async');
        var util = require('util');
        var moment = require('moment');
        var tasksAsync = [],
            taskAsync;
        var strSql,
            strWhere = '',
            strWhereExists = '',
            result;
        var skip,
            limit,
            orderBy = ' IH.ID ';

        skip = parseInt(params.skip);
        limit = parseInt(params.limit);

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.log("%s, Error en Oracle getInvoices.", new Date());
                    this.cn.doRelease(connection);
                    if (callback) return callback(err);
                } else {

                    if (params.order) {
                        orderBy = this.cn.orderBy(params.order).toUpperCase();
                        var order = (orderBy.includes('ASC')) ? ' ASC' : ' DESC';
                        if (orderBy.includes('NROPTOVENTA'))
                            orderBy = 'NRO_PTO_VENTA';
                        else if (orderBy.includes('CODTIPOCOMPROB'))
                            orderBy = 'COD_TIPO_COMPROB';
                        else if (orderBy.includes('RAZON'))
                            orderBy = 'RAZON';
                        else if (orderBy.includes('NROCOMPROB'))
                            orderBy = 'NRO_COMPROB';
                        else if (orderBy.includes('FECHA.EMISION'))
                            orderBy = 'FECHA_EMISION';
                        else if (orderBy.includes('IMPORTE.TOTAL'))
                            orderBy = 'TOTAL';

                        orderBy += order;
                    }

                    if (params.terminal) {
                        strWhere += util.format(" TERMINAL = '%s' AND ", params.terminal);
                    }
                    if (params.fechaInicio) {
                        strWhere += util.format(" FECHA_EMISION >= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                    }
                    if (params.fechaFin) {
                        strWhere += util.format(" FECHA_EMISION <= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                    }
                    if (params.nroPtoVenta) {
                        strWhere += util.format(" NRO_PTO_VENTA = %s AND ", params.nroPtoVenta);
                    }
                    if (params.codTipoComprob) {
                        strWhere += util.format(" COD_TIPO_COMPROB = %s AND ", params.codTipoComprob);
                    }
                    if (params.nroComprobante) {
                        strWhere += util.format(" NRO_COMPROB = %s AND ", params.nroComprobante);
                    }
                    if (params.razonSocial) {
                        strWhere += util.format(" RAZON = '%s' AND ", params.razonSocial);
                    }
                    if (params.documentoCliente) {
                        strWhere += util.format(" NRO_DOC = %s AND ", params.documentoCliente);
                    }
                    if (params.resend) {
                        strWhere += util.format(" RESEND = %s AND ", params.resend);
                    }
                    //DETAIL
                    if (params.contenedor) {
                        strWhereExists += util.format(" CONTENEDOR = '%s' AND ", params.contenedor);
                    }
                    if (params.buqueNombre) {
                        strWhereExists += util.format(" BUQUE_NOMBRE = '%s' AND ", params.buqueNombre);
                    }
                    if (params.viaje) {
                        strWhereExists += util.format(" BUQUE_VIAJE = '%s' AND ", params.viaje);
                    }
                    if (params.code) {
                        strWhereExists += util.format(" CODE = '%s' AND ", params.code);
                    }

                    if (strWhereExists.length > 0) {
                        strWhereExists = util.format('( SELECT * FROM INVOICE_DETAIL WHERE IH.ID = INVOICE_HEADER_ID AND %s )', strWhereExists.substr(0, strWhereExists.length - 4));
                        strWhere += util.format(" EXISTS %s AND ", strWhereExists);
                    }

                    if (strWhere.length > 0) {
                        strWhere = util.format(" WHERE %s ", strWhere.substr(0, strWhere.length - 4));
                    }

                    taskAsync = asyncCallback => {
                        strSql = `SELECT I.*, USR, GRUPO, STATE
                                    FROM (SELECT IH.ID,
                                            TERMINAL,
                                            COD_TIPO_COMPROB,
                                            NRO_PTO_VENTA,
                                            RAZON,
                                            FECHA_EMISION,
                                            NRO_COMPROB,
                                            IMPORTE_TOTAL,
                                            TOTAL,
                                            USR, GRUPO, STATE,
                                            ROW_NUMBER() OVER (ORDER BY ${orderBy} ) R
                                            FROM INVOICE_HEADER  IH
                                                 INNER JOIN INVOICE_STATE STA ON  IH.ID = STA.INVOICE_HEADER_ID AND
                                                                                STA.ID = (SELECT MAX(ST1.ID) FROM INVOICE_STATE ST1 WHERE ST1.INVOICE_HEADER_ID = IH.ID)
                                            %s ) I
                                      WHERE R BETWEEN :1 and :2`;

                        strSql = util.format(strSql, strWhere);
                        connection.execute(strSql, [skip, skip + limit], {}, (err, data) => {
                            if (err) {
                                asyncCallback(err);
                            } else {
                                if (data.rows) {
                                    result = {
                                        status: "OK"
                                    };
                                    result.data = data.rows.map(item => (
                                    {
                                        _id: item.ID,
                                        terminal: item.TERMINAL,
                                        codTipoComprob: item.COD_TIPO_COMPROB,
                                        nroComprob: item.NRO_COMPROB,
                                        razon: item.RAZON,
                                        importe: {total: item.IMPORTE_TOTAL},
                                        fecha: {emision: item.FECHA_EMISION},
                                        nroPtoVenta: item.NRO_PTO_VENTA,
                                        estado: {
                                            state: item.STATE,
                                            group: item.GRUPO,
                                            user: item.USR
                                        }
                                    }));
                                }
                                asyncCallback(undefined, result);
                            }
                        });
                    };
                    tasksAsync.push(taskAsync);

                    taskAsync = asyncCallback => {
                        strSql = "SELECT count(*) TOTAL " +
                            "FROM INVOICE_HEADER IH %s";

                        strSql = util.format(strSql, strWhere);

                        connection.execute(strSql, [], {}, (err, data) => {
                            if (err) {
                                asyncCallback(err);
                            } else {
                                let total = 0;
                                if (data.rows) {
                                    total = data.rows[0].TOTAL;
                                }
                                asyncCallback(undefined, total);
                            }
                        });
                    };
                    tasksAsync.push(taskAsync);

                    async.parallel(tasksAsync, (err, data) => {
                        this.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: "ERROR en getInvoices"});
                        } else {
                            var invoices = data[0];
                            if (invoices) {
                                invoices.totalCount = data[1];
                                if (callback) return callback(undefined, invoices);
                            } else {
                                if (callback) return callback({status: "ERROR", message: "ERROR en getInvoices"});
                            }
                        }
                    });
                }
            });
        }
    }

    getClients (params, callback) {
        var self = this;
        var strSql;
        var pool = self.cn.pool;

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    self.cn.doRelease(connection);
                    if (callback) return callback(err);
                } else {
                    strSql = `SELECT DISTINCT RAZON FROM INVOICE_HEADER WHERE TERMINAL = :1 ORDER BY RAZON`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY, resultSet: true}, (err, data) => {
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: err.message, data: err});
                        } else {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                            .then(data => {
                                    resultSet.close(err=> {
                                        this.cn.doRelease(connection);
                                    });
                                    if (callback) return callback(undefined, {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data.map(item => {return item[0];})
                                    });
                                })
                            .catch(err => {
                                    console.info(err);
                                    this.cn.doRelease(connection);
                                    callback({status: "ERROR", message: err.message, data: err});
                                });
                        }
                    });
                }
            });
        }
    }

    getContainers (params, callback) {
        var self = this;
        var strSql;
        var pool = self.cn.pool;

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    self.cn.doRelease(connection);
                    if (callback) return callback(err);
                } else {
                    strSql = `SELECT DISTINCT CONTENEDOR
                            FROM INVOICE_DETAIL IND
                                INNER JOIN INVOICE_HEADER INH ON IND.INVOICE_HEADER_ID = INH.ID
                            WHERE TERMINAL = :1 ORDER BY CONTENEDOR`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY, resultSet: true}, (err, data) => {
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: err.message, data: err});
                        } else {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {
                                    resultSet.close(err=> {
                                        this.cn.doRelease(connection);
                                    });
                                    if (callback) return callback(undefined, {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data.map(item => {return item[0];})
                                    });
                                })
                                .catch(err => {
                                    console.info(err);
                                    this.cn.doRelease(connection);
                                    callback({status: "ERROR", message: err.message, data: err});
                                });
                        }
                    });
                }
            });
        }
    }

    getCounts (params, callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            fechaEmision,
            util = require('util'),
            moment = require('moment'),
            Enumerable = require('linq'),
            response;

        if (pool) {
            pool.getConnection (function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle getCounts.", new Date());
                    self.cn.doRelease(connection);
                } else {

                    fechaEmision = moment().format('YYYY-MM-DD');

                    if (params.fecha !== undefined) {
                        fechaEmision = moment(params.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
                    }

                    strSql = "SELECT terminal,cod_Tipo_Comprob, sum(total) as total, count(*) as cnt " +
                        " FROM INVOICE_HEADER " +
                        " WHERE FECHA_EMISION = TO_DATE(:1,'YYYY-MM-DD') " +
                        "GROUP BY terminal,cod_Tipo_Comprob ";


                    connection.execute(strSql, [fechaEmision], {}, function (err, data) {
                        if (err) {
                            callback({status: "ERROR", message: err.message, data: err});
                        } else {

                            response = Enumerable.from(data.rows)
                                .groupBy('$.COD_TIPO_COMPROB',
                                function (item) {
                                    return item;
                                },
                                function (job, grouping) {
                                    var grupo = grouping.getSource(),
                                        cnt = grouping.sum(function (item) {
                                            return item.CNT;
                                        }),
                                        tot = grouping.sum(function (item) {
                                            return item.TOTAL;
                                        }),
                                        grupoItem = {
                                            codTipoComprob: job,
                                            cnt: cnt,
                                            total: tot
                                        };

                                    grupo.forEach(function (item) {
                                        var porcenCnt = item.CNT * 100 / cnt,
                                            porcenTotal = item.TOTAL * 100 / tot;

                                        grupoItem[item.TERMINAL] = {
                                            cnt: [item.CNT, porcenCnt],
                                            total: [item.TOTAL, porcenTotal]
                                        };
                                    });

                                    return grupoItem;
                                }).toArray();

                            callback(undefined, {
                                status: "OK",
                                data: response
                            });
                        }
                    });
                }
            });
        }
    }

    getCountByDate (params, callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            fechaEmision,
            date5Ago,
            tomorrow,
            util = require('util'),
            moment = require('moment'),
            response;

        if (pool) {
            pool.getConnection (function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle getCountByDate.", new Date());
                    self.cn.doRelease(connection);
                } else {

                    fechaEmision = moment().format('YYYY-MM-DD');

                    if (params.fecha !== undefined) {
                        fechaEmision = moment(params.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
                    }
                    date5Ago = moment(fechaEmision).subtract(4, 'days').format('YYYY-MM-DD');
                    tomorrow = moment(fechaEmision).add(1, 'days').format('YYYY-MM-DD');

                    strSql = "SELECT terminal, " +
                        " FECHA_EMISION, " +
                        " sum(total) as total, " +
                        " count(*) as cnt " +
                        " FROM INVOICE_HEADER " +
                        " WHERE FECHA_EMISION < TO_DATE(:1,'YYYY-MM-DD') AND " +
                        "       FECHA_EMISION >= TO_DATE(:2,'YYYY-MM-DD') " +
                        "GROUP BY terminal, FECHA_EMISION " +
                        "ORDER BY FECHA_EMISION, TERMINAL ";

                    connection.execute(strSql, [tomorrow, date5Ago], {}, function (err, data) {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: err.message, data: err});
                        } else {
                            response = data.rows.map(function (item) {
                                return {
                                    cnt: (item.CNT === null) ? 0 : item.CNT,
                                    total: (item.TOTAL === null) ? 0 : item.TOTAL,
                                    terminal: item.TERMINAL,
                                    date: item.FECHA_EMISION
                                };
                            });

                            if (callback) return callback(undefined, {
                                                            status: "OK",
                                                            data: response
                                                        });
                        }
                    });
                }
            });
        }
    }

    getCountByMonth (params, callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            fechaEmision,
            month5Ago,
            nextMonth,
            util = require('util'),
            moment = require('moment'),
            response;

        if (pool) {
            pool.getConnection (function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle getCountByDate.", new Date());
                    self.cn.doRelease(connection);
                } else {

                    fechaEmision = moment(moment().format('YYYY-MM-DD')).subtract(moment().date() - 1, 'days').format('YYYY-MM-DD');

                    if (params.fecha !== undefined) {
                        fechaEmision = moment(params.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
                    }
                    month5Ago = moment(fechaEmision).subtract(4, 'months').format('YYYY-MM-DD');
                    nextMonth = moment(fechaEmision).add(1, 'months').format('YYYY-MM-DD');

                    strSql = "" +
                        "SELECT terminal, TO_NUMBER(TO_CHAR(fecha_emision, 'YYYY')) YEAR, " +
                        "       TO_NUMBER(TO_CHAR(fecha_emision, 'MM')) MONTH, " +
                        "       TO_NUMBER(TO_CHAR(fecha_emision, 'YYYYMM')) DIA, " +
                        "       sum(total) as total, count(*) as cnt " +
                        " FROM INVOICE_HEADER " +
                        " WHERE FECHA_EMISION < TO_DATE(:1,'YYYY-MM-DD') AND " +
                        "       FECHA_EMISION >= TO_DATE(:2,'YYYY-MM-DD') " +
                        "GROUP BY terminal,TO_NUMBER(TO_CHAR(fecha_emision, 'YYYY')), " +
                        "       TO_NUMBER(TO_CHAR(fecha_emision, 'MM')), " +
                        "       TO_NUMBER(TO_CHAR(fecha_emision, 'YYYYMM')) " +
                        "ORDER BY DIA, TERMINAL ";

                    connection.execute(strSql, [nextMonth, month5Ago], {}, function (err, data) {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: err.message, data: err});
                        } else {
                            response = data.rows.map(function (item) {
                                return {
                                    terminal: item.TERMINAL,
                                    year: item.YEAR,
                                    month: item.MONTH,
                                    dia: item.DIA,
                                    cnt: item.CNT,
                                    total: item.TOTAL
                                };
                            });

                            if (callback) return callback(undefined, {
                                                            status: "OK",
                                                            data: response
                                                        });
                        }
                    });
                }
            });
        }
    }

    getCashbox (params, callback) {
        var self = this;
        var moment = require('moment');
        var util = require('util');
        var pool = self.cn.pool;
        var strSql = '',
            strWhere = '',
            strWhereExists = '';

        if (pool) {
            if (params.terminal) {
                strWhere += util.format(" TERMINAL = '%s' AND ", params.terminal);
            }
            if (params.fechaInicio) {
                strWhere += util.format(" FECHA_EMISION >= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD'));
            }
            if (params.fechaFin) {
                strWhere += util.format(" FECHA_EMISION <= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD'));
            }
            if (params.nroPtoVenta) {
                strWhere += util.format(" NRO_PTO_VENTA = %s AND ", params.nroPtoVenta);
            }
            if (params.codTipoComprob) {
                strWhere += util.format(" COD_TIPO_COMPROB = %s AND ", params.codTipoComprob);
            }
            if (params.nroComprobante) {
                strWhere += util.format(" NRO_COMPROB = %s AND ", params.nroComprobante);
            }
            if (params.razonSocial) {
                strWhere += util.format(" RAZON = '%s' AND ", params.razonSocial);
            }
            if (params.documentoCliente) {
                strWhere += util.format(" NRO_DOC = %s AND ", params.documentoCliente);
            }
            if (params.resend) {
                strWhere += util.format(" RESEND = %s AND ", params.resend);
            }
            //DETAIL
            if (params.contenedor) {
                strWhereExists += util.format(" CONTENEDOR = '%s' AND ", params.contenedor);
            }
            if (params.buqueNombre) {
                strWhereExists += util.format(" BUQUE_NOMBRE = '%s' AND ", params.buqueNombre);
            }
            if (params.viaje) {
                strWhereExists += util.format(" BUQUE_VIAJE = '%s' AND ", params.buqueViaje);
            }
            if (params.code) {
                strWhereExists += util.format(" CODE = '%s' AND ", params.code);
            }
            if (strWhereExists.length > 0) {
                strWhereExists = util.format('( SELECT * FROM INVOICE_DETAIL WHERE INVOICE_HEADER.ID = INVOICE_HEADER_ID AND %s )', strWhereExists.substr(0, strWhereExists.length - 4));
                strWhere += util.format(" EXISTS %s AND ", strWhereExists);
            }

            if (strWhere.length > 0) {
                strWhere = util.format(" WHERE %s ", strWhere.substr(0, strWhere.length - 4));
            }

            strSql = 'SELECT DISTINCT NRO_PTO_VENTA ' +
                'FROM INVOICE_HEADER ' +
                '%s '
            strSql = util.format(strSql, strWhere);

            pool.getConnection ((err, connection) => {
                if (err) {
                    console.log("%s, Error en Oracle getCashbox.", new Date());
                    self.cn.doRelease(connection);
                    callback (err);
                } else {
                    connection.execute(strSql, [], {}, (err, data) => {
                        self.cn.doRelease(connection);
                        if (err) {
                            callback (err);
                        } else {
                            var puntos = [];
                            if (data.rows.length>0) {
                                puntos = data.rows.map(item => {
                                    return item.NRO_PTO_VENTA;
                                });
                            }
                            callback (undefined, puntos);
                        }
                    });
                }
            });
        }
    }

    getCorrelative (params, callback ) {

        var util = require('util');
        var pool = this.cn.pool;
        var moment = require('moment');
        var Enumerable = require('linq');

        if (params.fechaInicio === undefined) {
            params.fechaInicio = moment("2014-08-01", 'YYYY-MM-DD').toDate();
        }
        if (params.fechaFin === undefined) {
            params.fechaFin = new Date();
        }

        if (pool) {
            let strSql = '';
            pool.getConnection((err, connection) => {
                if (err) {
                    console.log("%s, Error en Oracle getCorrelative.", new Date());
                    this.cn.doRelease(connection);
                    callback(err);
                } else {
                    strSql = `BEGIN sp_correlative(:P_TERMINAL, :P_NRO_PTO_VENTA, :P_COD_TIPO_COMPROB, :P_INICIO, :P_FIN, :RESULT_CURSOR); END;`;
                    params = {
                        P_TERMINAL: params.terminal,
                        P_NRO_PTO_VENTA: params.nroPtoVenta,
                        P_COD_TIPO_COMPROB: params.codTipoComprob,
                        P_INICIO: params.fechaInicio,
                        P_FIN: params.fechaFin,
                        RESULT_CURSOR: {type: this.cn.oracledb.CURSOR, dir: this.cn.oracledb.BIND_OUT}
                    };

                    connection.execute(strSql, params, {}, (err, data) => {
                        let rSet = data.outBinds.RESULT_CURSOR;
                        let result;
                        getResultSet(connection, rSet, 1000)
                            .then(data => {
                                rSet.close(err => {
                                    this.cn.doRelease(connection);
                                });
                                var total = Enumerable.from(data).sum('x=>x.RES');
                                var data = Enumerable.from(data)
                                    .select (item => {
                                    let objResult;
                                    if (item.RES > 1) {
                                        objResult = {n: util.format('[%d a %d] (%d)', item.STA, item.STO, item.RES), d: null};
                                    } else {
                                        objResult = {n: util.format('%d', item.STA), d: null};
                                    }
                                    return objResult;
                                }).toArray();
                                result = {
                                    status: "OK",
                                    totalCount: total,
                                    data: data
                                };
                                if (callback) return callback(undefined, result);
                            })
                            .catch(err => {
                                rSet.close(err => {
                                    this.cn.doRelease(connection);
                                });
                                console.error(err);
                                result = {
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                };
                                return callback(result);
                            });
                    });
                }
            });
        }

    }

    getDistinct (distinct, params, callback) {
        var self = this;
        var strSql;
        var pool = self.cn.pool;

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    self.cn.doRelease(connection);
                    if (callback) return callback(err);
                } else {
                    strSql = `SELECT DISTINCT ${distinct} FROM INVOICE_HEADER WHERE TERMINAL = :1 ORDER BY ${distinct}`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY}, (err, data) => {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: err.message, data: err});
                        } else {
                            let result = data.rows.map(item => {return item[0];});
                            if (callback) return callback(undefined, {
                                status: "OK",
                                totalCount: result.length,
                                data: result
                            });
                        }
                    });
                }
            });
        }
    }

    getNoRates (params, callback) {

    }

    getNoMatches (params) {
        var promise = new Promise((resolve, reject) => {
            var strWhere = '';
            var codeWhere = '';
            var pool = this.cn.pool;
            var moment = require('moment');
            var async = require('async');
            var task, tasks = [];
            var skip = params.skip,
                limit = params.limit,
                orderBy = 'IH.ID';

            if (pool) {

                    pool.getConnection((err, connection) => {
                        if (err) {
                            console.log("%s, Error en Oracle getNoMatches.", new Date());
                            reject({
                                status: 'ERROR',
                                message: err.message,
                                data: err
                            });
                        } else {

                            if (params.order) {
                                orderBy = this.cn.orderBy(params.order).toUpperCase();
                                var order = (orderBy.includes('ASC')) ? ' ASC' : ' DESC';
                                if (orderBy.includes('NROPTOVENTA'))
                                    orderBy = 'NRO_PTO_VENTA';
                                else if (orderBy.includes('CODTIPOCOMPROB'))
                                    orderBy = 'COD_TIPO_COMPROB';
                                else if (orderBy.includes('RAZON'))
                                    orderBy = 'RAZON';
                                else if (orderBy.includes('NROCOMPROB'))
                                    orderBy = 'NRO_COMPROB';
                                else if (orderBy.includes('FECHA.EMISION'))
                                    orderBy = 'FECHA_EMISION';
                                else if (orderBy.includes('IMPORTE.TOTAL'))
                                    orderBy = 'TOTAL';

                                orderBy += order;
                            }

                            if (params.fechaInicio) {
                                strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }
                            if (params.fechaFin) {
                                strWhere += ` FECHA_EMISION <= TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }
                            if (params.razonSocial) {
                                strWhere += ` RAZON = '${params.razonSocial}' AND `;
                            }
                            if (params.code) {
                                codeWhere = ` CODE = '${params.code}' AND `;
                            }

                            if (strWhere.length > 0) {
                                strWhere = ` AND ${strWhere.substr(0, strWhere.length - 4)}`;
                            }

                            task = asyncMainQuery => {

                                var strSql = `SELECT I.*
                                              FROM (SELECT
                                                IH.ID,
                                                NRO_PTO_VENTA,
                                                COD_TIPO_COMPROB,
                                                NRO_COMPROB,
                                                RAZON,
                                                FECHA_EMISION,
                                                TERMINAL,
                                                IMPORTE_TOTAL,
                                                TOTAL,
                                                USR, GRUPO, STATE,
                                                ROW_NUMBER() OVER (ORDER BY ${orderBy} ) R
                                            FROM INVOICE_HEADER  IH
                                                INNER JOIN VOUCHER_TYPE V ON IH.COD_TIPO_COMPROB = V.ID
                                                INNER JOIN INVOICE_STATE STA ON  IH.ID = STA.INVOICE_HEADER_ID AND
                                                                        STA.ID = ( SELECT MAX(ST1.ID)
                                                                                    FROM INVOICE_STATE ST1
                                                                                    WHERE ST1.INVOICE_HEADER_ID = IH.ID )
                                            WHERE
                                                  IH.ID IN ( SELECT INVOICE_HEADER_ID
                                                              FROM INVOICE_DETAIL INVD
                                                              WHERE ${codeWhere}
                                                                  NOT EXISTS (
                                                                    SELECT *
                                                                    FROM TARIFARIO_TERMINAL TT
                                                                    WHERE TT.TERMINAL = IH.TERMINAL AND
                                                                          TT.CODE = INVD.CODE ) ) AND
                                                  TERMINAL = '${params.terminal}'
                                                  ${strWhere}
                                            ) I
                                            WHERE R BETWEEN :1 AND :2`;

                                connection.execute(strSql, [skip, skip+limit], {}, (err, data) => {
                                    if (err) {
                                        asyncMainQuery(err);
                                    } else {
                                        if (data.rows) {
                                            let result;
                                            result = data.rows.map(item => (
                                            {
                                                _id: item.ID,
                                                terminal: item.TERMINAL,
                                                codTipoComprob: item.COD_TIPO_COMPROB,
                                                nroComprob: item.NRO_COMPROB,
                                                razon: item.RAZON,
                                                importe: {total: item.IMPORTE_TOTAL},
                                                fecha: {emision: item.FECHA_EMISION},
                                                nroPtoVenta: item.NRO_PTO_VENTA,
                                                estado: {
                                                    state: item.STATE,
                                                    group: item.GRUPO,
                                                    user: item.USR
                                                }
                                            }));
                                            asyncMainQuery(undefined, result);
                                        }
                                    }
                                });
                            };
                            tasks.push(task);

                            task = asyncCountQuery => {
                                var strSql = `SELECT
                                                COUNT(*) AS TOTAL
                                            FROM INVOICE_HEADER  IH
                                            WHERE IH.ID IN ( SELECT INVOICE_HEADER_ID
                                                              FROM INVOICE_DETAIL INVD
                                                              WHERE ${codeWhere}
                                                                NOT EXISTS (
                                                                    SELECT *
                                                                    FROM TARIFARIO_TERMINAL TT
                                                                    WHERE TT.TERMINAL = IH.TERMINAL AND
                                                                          TT.CODE = INVD.CODE ) ) AND
                                                  TERMINAL = '${params.terminal}'
                                                  ${strWhere}`;

                                connection.execute(strSql, [], {}, (err, data) => {
                                    if (err) {
                                        asyncCountQuery(err);
                                    } else {
                                        if (data.rows) {
                                            let result;
                                            result = data.rows[0].TOTAL;
                                            asyncCountQuery(undefined, result);
                                        }
                                    }
                                });
                            };
                            tasks.push(task);

                            async.parallel(tasks, (err, data) => {
                                this.cn.doRelease(connection);
                                if (err) {
                                    reject({
                                        status: "ERROR",
                                        message: err.message,
                                        data: err
                                    });
                                } else {
                                    resolve({
                                        status: 'OK',
                                        totalCount: data[1],
                                        data: data[0]
                                    });
                                }
                            });

                        }
                    });
            }
        });
        return promise;
    }

    getContainersNoRates (params, callback) {

        var self = this;
        var strSql;
        var strWhere = '';
        var pool = self.cn.pool;
        var util = require('util');
        var moment = require('moment');

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    if (callback) return callback(err);
                } else {
                    strSql =`SELECT DISTINCT ID2.CONTENEDOR
                            FROM INVOICE_DETAIL ID2
                              INNER JOIN INVOICE_HEADER IH2 ON IH2.ID = ID2.INVOICE_HEADER_ID
                            WHERE IH2.COD_TIPO_COMPROB = 1 AND
                                ID2.CONTENEDOR IS NOT NULL AND
                                IH2.TERMINAL = :1 AND
                                NOT EXISTS (select *
                                from INVOICE_HEADER IH1,
                                    INVOICE_DETAIL ID1,
                                    TARIFARIO_TERMINAL TT
                                WHERE IH1.ID = ID1.INVOICE_HEADER_ID AND
                                      TT.TERMINAL = IH1.TERMINAL AND
                                      ID1.CODE = TT.CODE AND
                                      IH1.TERMINAL = IH2.TERMINAL AND
                                      IH1.COD_TIPO_COMPROB = IH2.COD_TIPO_COMPROB AND
                                      ID2.CONTENEDOR = ID1.CONTENEDOR AND
                                      TARIFARIO_ID IN (
                                      select ID
                                      from TARIFARIO
                                      where TERMINAL = 'AGP' AND
                                            RATE is not null) ) %s`;

                    if (params.fechaInicio) {
                        strWhere += util.format(" IH2.FECHA_EMISION >= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                    }
                    if (params.fechaFin) {
                        strWhere += util.format(" IH2.FECHA_EMISION <= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                    }

                    if (params.buqueNombre) {
                        strWhere += util.format(" ID2.BUQUE_NOMBRE = '%s' AND ", params.buqueNombre);
                    }

                    if (params.viaje) {
                        strWhere += util.format(" ID2.BUQUE_VIAJE = '%s' AND ", params.viaje);
                    }

                    if (strWhere.length > 0) {
                        strWhere = util.format(" AND %s ", strWhere.substr(0, strWhere.length - 4));
                    }

                    strSql = util.format(strSql, strWhere);

                    connection.execute(strSql, [params.terminal], {resultSet: true}, (err, data) => {
                        let result;
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: err.message, data: err});
                        } else {
                            let rSet = data.resultSet;
                            getResultSet(connection, rSet, 1000)
                                .then(data => {
                                    rSet.close(err => {
                                        self.cn.doRelease(connection);
                                    })
                                    data = data.map(item => {
                                        return item.CONTENEDOR;
                                    });
                                    result = {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data
                                    };
                                    if (callback) return callback(undefined, result);
                                })
                                .catch(err => {
                                    self.cn.doRelease(connection);
                                    console.error(err);
                                });
                        }
                    });
                }
            });
        }
    }

    getShips (params, callback) {
        var self = this;
        var strSql;
        var pool = self.cn.pool;

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    self.cn.doRelease(connection);
                    if (callback) return callback(err);
                } else {
                    strSql = `SELECT DISTINCT BUQUE_NOMBRE
                            FROM INVOICE_DETAIL IND
                                INNER JOIN INVOICE_HEADER INH ON IND.INVOICE_HEADER_ID = INH.ID
                            WHERE TERMINAL = :1 ORDER BY BUQUE_NOMBRE`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY, resultSet: true}, (err, data) => {
                        if (err) {
                            if (callback) return callback({status: "ERROR", message: err.message, data: err});
                        } else {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {
                                    resultSet.close(err=> {
                                        this.cn.doRelease(connection);
                                    });
                                    if (callback) return callback(undefined, {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data.map(item => {return item[0];})
                                    });
                                })
                                .catch(err => {
                                    console.info(err);
                                    this.cn.doRelease(connection);
                                    callback({status: "ERROR", message: err.message, data: err});
                                });
                        }
                    });
                }
            });
        }
    }

    getTotal (params, callback) {
        callback();
    }

    getTotalByClient (params, options, callback) {
        callback();
    }

    setResend (id, resend) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql = '';

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        strSql = `UPDATE INVOICE_HEADER
                                    SET RESEND = :1
                                    WHERE ID = :2`;
                        connection.execute(strSql, [resend, id], {autoCommit: true}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                resolve({
                                    status: "OK",
                                    data: data
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    toString() {
        return "Invoice class on Oracle 11g";
    }

}

class InvoiceMongoDB {
    constructor (model) {
        this.model = model;
        this.payings = require('../models/paying.js');
        this.comments = require('../models/comment.js');
        this.matchPrice = require('../models/matchPrice.js');
    }

    add (param, io, callback) {
        var self = this;
        var invoice,
            errMsg,
            subTotalCheck,
            usr,
            postData,
            strSubject,
            body,
            buqueId,
            buqueDesc,
            viaje,
            fecha,
            buque,
            contenedor,
            cont,
            mailer,
            invoice2add,
            util = require('util'),
            moment = require('moment');

        var mail = require("../include/emailjs"),
            dateTime = require('../include/moment'),
            config = require('../config/config.js');

        var Invoice = this.model;

        try {

            usr = param.usr;
            delete param.usr;
            postData = param;

            invoice = {
                terminal: usr.terminal,
                tipo: postData.tipo,
                nroPtoVenta: postData.nroPtoVenta,
                codTipoComprob: parseInt(postData.codTipoComprob.toString().trim(), 10),
                nroComprob: postData.nroComprob,
                codTipoAutoriz: postData.codTipoAutoriz,
                codAutoriz: postData.codAutoriz,
                codTipoDoc: postData.codTipoDoc,
                nroDoc: postData.nroDoc,
                clienteId: postData.clientId,
                razon: postData.razon.trim(),
                importe: {
                    gravado: Math.abs(postData.impGrav),
                    noGravado: Math.abs(postData.impNoGrav),
                    exento: Math.abs(postData.impExento),
                    subtotal: Math.abs(postData.impSubtot),
                    iva: Math.abs(postData.impIva),
                    otrosTributos: postData.impOtrosTrib,
                    total: Math.abs(postData.impTotal)
                },
                codMoneda: postData.codMoneda,
                cotiMoneda: postData.cotiMoneda,
                observa: postData.observa,
                codConcepto: postData.codConcepto,
                fecha: {
                    emision: moment(postData.fechaEmision, "YYYY-MM-DDT00:00:00.000.Z"),
                    vcto: moment(postData.fechaVcto, "YYYY-MM-DDT00:00:00.000.Z"),
                    desde: moment(postData.fechaServDesde, "YYYY-MM-DDT00:00:00.000.Z"),
                    hasta: moment(postData.fechaServHasta, "YYYY-MM-DDT00:00:00.000.Z"),
                    vctoPago: moment(postData.fechaVctoPago, "YYYY-MM-DDT00:00:00.000.Z")
                },
                detalle: [],
                otrosTributos: [],
                estado: [
                    {
                        estado: "Y",
                        grupo: "ALL",
                        user: usr.user
                    }
                ],
                comment: []
            };

            if (postData.otrosTributos) {
                postData.otrosTributos.forEach(function (item) {

                    var otId = (item.id !== undefined) ? item.id.toString() : null;
                    var otDesc = item.desc;

                    invoice.otrosTributos.push(
                        {
                            id: (otId) ? otId : "",
                            desc: (otDesc) ? otDesc.trim() : "",
                            imponible: Math.abs(item.imponible),
                            imp: item.imp
                        });
                });
            }

            subTotalCheck = 0;
            if (postData.detalle && postData.detalle.length > 0) {
                postData.detalle.forEach(function (container) {
                    buqueId = (container.buqueId !== undefined && container.buqueId !== null) ? container.buqueId.toString() : "";
                    buqueDesc = container.buqueDesc;
                    viaje = container.viaje;
                    fecha = (container.fecha !== undefined && container.fecha !== "" && container.fecha != null) ? moment(container.fecha, "YYYY-MM-DD") : "";
                    buque = {
                        codigo: (buqueId) ? buqueId.trim() : "",
                        nombre: (buqueDesc) ? buqueDesc.trim() : "",
                        viaje: (viaje) ? viaje.trim() : "",
                        fecha: fecha
                    };

                    contenedor = container.contenedor;
                    cont = {
                        contenedor: (contenedor) ? container.contenedor.trim() : "",
                        IMO: container.IMO,
                        buque: buque,
                        items: []
                    };
                    if (container.items) {
                        container.items.forEach(function (item) {
                            cont.items.push(
                                {
                                    id: item.id,
                                    cnt: Math.abs(item.cnt),
                                    uniMed: item.uniMed,
                                    impUnit: item.impUnit,
                                    impTot: Math.abs(item.impTot)
                                });
                            subTotalCheck += Math.abs(item.impTot);
                        });
                    } else {
                        errMsg = util.format("El contenedor no posee items. %s, %j", usr.terminal, postData);
                        if (callback) return callback({
                                                status: "ERROR",
                                                message: errMsg,
                                                data: postData
                                            });
                    }
                    invoice.detalle.push(cont);
                });

            } else {
                errMsg = util.format("El comprobante no posee detalles. %s. - %j", usr.terminal, postData);
                if (callback) return callback({
                                status: "ERROR",
                                message: errMsg,
                                data: postData
                            });
            }

        } catch (error) {
            strSubject = util.format("AGP - %s - ERROR", usr.terminal);
            body = util.format('Error al insertar comprobante. %s. \n%s',  error.message, JSON.stringify(postData));

            mailer = new mail.mail(config.email);
            mailer.send(usr.email, strSubject, body, function () {});
            if (callback) return callback({
                            status: "ERROR",
                            message: body,
                            data: body
                        });
        }

        invoice2add = new Invoice(invoice);
        invoice2add.save(function (errSave, data) {
            var socketMsg;
            if (!errSave) {
                socketMsg = {
                    status: 'OK',
                    data : {
                        terminal : data.terminal,
                        _id: data._id,
                        emision : data.fecha.emision,
                        codTipoComprob : data.codTipoComprob,
                        razon: data.razon,
                        nroComprob: data.nroComprob
                    }
                };
                io.emit('invoice', socketMsg);

                var comment = 'Comprobante transferido correntamente.';
                var commentState = 'Y';

                if ((subTotalCheck > postData.impSubtot + 2) || (subTotalCheck < postData.impSubtot - 2)) {
                    comment = util.format("El subtotal del comprobante es incorrecto, la suma es %d y se informa %d. - %s.", subTotalCheck, postData.impSubtot, usr.terminal);
                    data.estado[0].estado = 'T';
                }

                self.comments.create({
                    invoice: data._id,
                    title: 'Transferencia comprobante.',
                    comment: comment,
                    state: commentState,
                    user: usr.user,
                    group: "ALL"
                }, function (err, commentAdded) {
                    if (err) {

                    } else {
                        data.comment.push(commentAdded._id);
                        data.save((err) => {
                            if (callback) return callback(undefined, {
                                status: "OK",
                                data: data
                            });
                        });
                    }
                });

            } else {
                //TODO crear objecto para tratar los errores, en este caso trato el tema de duplicados.
                if (errSave.code === 11000) {
                    Invoice.find({
                        terminal: usr.terminal,
                        codTipoComprob: invoice.codTipoComprob,
                        nroComprob: invoice.nroComprob,
                        nroPtoVenta: invoice.nroPtoVenta
                    }, function (err, invoices) {

                        var estado = invoices[0].resend;
                        if (estado === 1) {
                            Invoice.remove({_id : invoices[0]._id}, function (err, delInvoice) {
                                this.comments.remove({invoice: invoices[0]._id}, function (errComment, delComment) {
                                    param.usr = usr;
                                    self.add(param, callback);
                                });
                            });
                        } else {
                            errMsg = util.format('Error INS: El tipo de comprobante: %s, número: %s, fue transferido el %s:\n - ERROR:%s', invoices[0].codTipoComprob, invoices[0].nroComprob, dateTime.getDateTimeFromObjectId(invoices[0]._id), errSave);

                            if (callback) return callback({
                                status: "ERROR",
                                message: "Error insertando Comprobante",
                                data: errMsg
                            });
                        }

                    });
                } else {
                    strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                    errMsg = util.format('Invoice INS: %s -\n%s - %s', errSave, JSON.stringify(postData), usr.terminal);

                    mailer = new mail.mail(config.email);
                    mailer.send(usr.email, strSubject, errMsg, function () {});
                    if (callback) return callback({
                                            status: "ERROR",
                                            data: errMsg
                                        });
                }
            }
        });
    }

    addState (params) {
        return new Promise((resolve, reject) => {

            Invoice.update({_id: params.invoiceId, 'estado.grupo': params.group},
                {$set: {'estado.$.estado' : req.body.estado}},
                function (err, rowAffected, data){
                    if (err) {
                        reject({status:'ERROR', message: 'Error en cambio de estado.', data: err});
                    } else  {

                        if (rowAffected === 0){
                            Invoice.findByIdAndUpdate( params._id,
                                { $push: { estado: { estado: params.estado, grupo: params.group, user: params.user } } },
                                {safe: true, upsert: true},
                                function (err, data ){
                                    if (err) {
                                        reject.send({status:'ERROR', message: 'Error en cambio de estado.', data: err});
                                    } else {
                                        resolve({status:'OK', data: data});
                                    }
                                });
                        } else {
                            resolve.send({status:'OK', data: data});
                        }
                    }
                });
        });
    }

    getInvoice (params) {
        return new Promise((resolve, reject) => {
            var param = {
                    _id: params._id
                },
                invoice;

            if (params.terminal)
                param.terminal = params.terminal;

            invoice = this.model.find(param);
            invoice.populate({path: 'payment'});
            invoice.exec((err, invoices) => {
                var moment = require('moment');
                if (err) {
                    reject({status:'ERROR', message: err.message, data: err});
                } else {
                    var invoice = {};
                    if (invoices.length>0) {
                        invoice = invoices[0]._doc;
                        invoice.registrado_en = moment(invoices[0]._id.getTimestamp()).format('DD-MM-YYYY HH:mm:ss');
                    }
                    resolve({status:"OK", data: invoice||null});
                }
            });
        });
    }

    getInvoices (filtro, callback) {
        var param = {},
            fecha,
            invoice,
            states,
            order,
            skip,
            limit,
            tasksAsync = [],
            taskAsync,
            async = require("async"),
            moment = require("moment");
        var Invoice = this.model;

        if (!filtro) {
            throw "Debe proveer el parametro filtro";
        }

        if (filtro.fechaInicio || filtro.fechaFin) {
            param["fecha.emision"] = {};
            if (filtro.fechaInicio) {
                fecha = moment(filtro.fechaInicio, 'YYYY-MM-DD').toDate();
                param["fecha.emision"]['$gte'] = fecha;
            }
            if (filtro.fechaFin) {
                fecha = moment(filtro.fechaFin, 'YYYY-MM-DD').toDate();
                param["fecha.emision"]['$lte'] = fecha;
            }
        }
        if (filtro.nroPtoVenta) {
            param.nroPtoVenta = filtro.nroPtoVenta;
        }
        if (filtro.codTipoComprob) {
            param.codTipoComprob = filtro.codTipoComprob;
        }
        if (filtro.nroComprobante) {
            param.nroComprob = filtro.nroComprobante;
        }
        if (filtro.razonSocial) {
            param.razon = {$regex: filtro.razonSocial};
        }
        if (filtro.documentoCliente) {
            param.nroDoc = filtro.documentoCliente;
        }

        if (filtro.contenedor) {
            param['detalle.contenedor'] = filtro.contenedor;
        }

        if (filtro.buqueNombre) {
            param['detalle.buque.nombre'] = filtro.buqueNombre;
        }

        if (filtro.viaje) {
            param['detalle.buque.viaje'] = filtro.viaje;
        }

        if (filtro.code) {
            param['detalle.items.id'] = filtro.code;
        }

        if (filtro.payment === '1') {
            param.payment = {$exists: true};
        }

        if (filtro.rates) {
            param['detalle.items.id'] = {$in: filtro.rates};
        }

        if (filtro.estado) {
            states = filtro.estado.split(",");
            param.$or = [
                { estado: {$size: 1, $elemMatch: {estado: {$in: states}, grupo: 'ALL'} } },
                { 'estado.1': { $exists: true }, estado: {$elemMatch: {estado: {$in: states}, grupo: filtro.group} } }
            ];
        }

        if (filtro.resend) {
            param.resend = filtro.resend;
        }

        param.terminal = filtro.terminal;

        taskAsync = function (asyncCallback) {
            invoice = Invoice.find(param, {
                nroPtoVenta: 1,
                codTipoComprob: 1,
                nroComprob: 1,
                razon: 1,
                'importe.total': 1,
                detalle: 1,
                estado:1,
                'fecha.emision': 1
            });
            invoice.populate({path: 'payment'});

            if (filtro.order) {
                order = JSON.parse(filtro.order);
                invoice.sort(order[0]);
            } else {
                invoice.sort({codTipoComprob: 1, nroComprob: 1});
            }

            if (filtro.limit) {
                limit = parseInt(filtro.limit, 10);
                skip = parseInt(filtro.skip, 10);
                invoice.skip(skip).limit(limit);
            }

            invoice.lean();
            invoice.exec(function (err, invoices) {
                if (!err) {
                    asyncCallback(undefined, invoices);
                } else {
                    asyncCallback(err);
                }
            });
        };
        tasksAsync.push(taskAsync);

        taskAsync = function (asyncCallback) {
            Invoice.count(param, function (err, cnt) {
                if (err) {
                    asyncCallback(err);
                } else {
                    asyncCallback(undefined, cnt);
                }
            });
        };
        tasksAsync.push(taskAsync);

        async.parallel(tasksAsync, function (err, data) {
            var cnt = data[1],
                datos = data[0],
                result = {};

            if (err) {
                if (callback !== undefined) return callback({status: "ERROR", message: err.message, data: err});
            } else {
                result = {
                    status: 'OK',
                    data: datos,
                    pageCount: (limit > datos.length) ? datos.length : limit,
                    page: skip,
                    totalCount: cnt
                };
                if (callback !== undefined) return callback(undefined,  result);
            };
        });

    }

    getClients (params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };

        this.model.distinct('razon', jsonParam, (err, data) => {
            if (err) {
                if (callback) callback({status: "ERROR", message: err.message, data: err});
            } else {
                data = data.sort();
                if (callback) callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                });
            }
        });
    }

    getContainers (params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };

        this.model.distinct('detalle.contenedor', jsonParam, (err, data) => {
            if (err) {
                if (callback) callback({status: "ERROR", message: err.message, data: err});
            } else {
                data = data.sort();
                if (callback) callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                });
            }
        });
    }

    getCounts (params, callback) {
        var self = this;
        var Invoice = self.model;
        var Enumerable = require('linq');
        var moment = require('moment');

        var jsonParam = [],
            match = {$match: {}},
            fechaEmision = moment(moment().format('YYYY-MM-DD')).toDate(),
            tomorrow,
            response;

        if (params.fecha !== undefined) {
            fechaEmision = moment(params.fecha, ['YYYY-MM-DD']).toDate();
        }
        tomorrow = moment(fechaEmision).add(1, 'days').toDate();
        match['$match'] = {'fecha.emision' : {$gte: fechaEmision, '$lt': tomorrow}};
        jsonParam.push(match);

        jsonParam.push({
            $group: {
                _id: {terminal: '$terminal', codTipoComprob: '$codTipoComprob'},
                total: {$sum: '$total'},
                cnt: {$sum: 1}
            }
        });
        jsonParam.push({$project : {_id: false, terminal: '$_id.terminal', codTipoComprob: '$_id.codTipoComprob', cnt : '$cnt', total: '$total'}});
        jsonParam.push({$sort: {'terminal': 1, 'codTipoComprob': 1}});

        Invoice.aggregate(jsonParam, function (err, data) {
            if (err) {
                callback({status: 'ERROR', data: err.message});
            } else {
                response = Enumerable.from(data)
                    .groupBy('$.codTipoComprob',
                    function (item) {
                        return item;
                    },
                    function (job, grouping) {
                        var grupo = grouping.getSource(),
                            cnt = grouping.sum(function (item) {
                                return item.cnt;
                            }),
                            tot = grouping.sum(function (item) {
                                return item.total;
                            }),
                            grupoItem = {
                                codTipoComprob: job,
                                cnt: cnt,
                                total: tot
                            };

                        grupo.forEach(function (item) {
                            var porcenCnt = item.cnt * 100 / cnt,
                                porcenTotal = item.total * 100 / tot;

                            grupoItem[item.terminal] = {
                                cnt: [item.cnt, porcenCnt],
                                total: [item.total, porcenTotal]
                            };
                        });

                        return grupoItem;
                    }).toArray();

                callback(undefined, {status: "OK", data: response});
            }
        });
    }

    getCountByDate (params, callback) {

        var Invoice = this.model;
        var moment = require('moment');
        var date,
            date5Ago,
            tomorrow,
            jsonParam,
            result;

        date = moment(moment().format('YYYY-MM-DD')).toDate();

        if (params.fecha !== undefined) {
            date = moment(params.fecha, 'YYYY-MM-DD').toDate();
        }
        date5Ago = moment(date).subtract(4, 'days').toDate();
        tomorrow = moment(date).add(1, 'days').toDate();

        jsonParam = [
            {$match: { 'fecha.emision': {$gte: date5Ago, $lt: tomorrow} }},
            { $project: {
                fecha: '$fecha.emision',
                accessDate: {$subtract: ['$fecha.emision', 180 * 60 * 1000]},
                terminal: '$terminal',
                total: '$total'}
            },
            { $group : {
                _id : { terminal: '$terminal',
                    year: { $year : "$accessDate" },
                    month: { $month : "$accessDate" },
                    day: { $dayOfMonth : "$accessDate" },
                    date: '$fecha'
                },
                cnt : { $sum : 1 },
                total: { $sum : '$total'}
            }},
            { $project: {
                _id: false,
                terminal: '$_id.terminal',
                date: '$_id.date',
                cnt: '$cnt',
                total: '$total'
            }},
            { $sort: {'date': 1, 'terminal': 1 }}
        ];

        result = Invoice.aggregate(jsonParam);

        result.exec(function (err, data) {
            if (err) {
                callback({status: "ERROR", data: err.message});
            } else {
                callback(undefined, {status: 'OK', data: data});
            }
        });

    }

    getCountByMonth (params, callback) {

        var Invoice = this.model;
        var moment = require('moment');

        var date = moment(moment().format('YYYY-MM-DD')).subtract(moment().date() - 1, 'days').toDate(),
            month5Ago,
            nextMonth,
            jsonParam;

        if (params.fecha !== undefined) {
            date = moment(params.fecha, ['YYYY-MM-DD']).subtract(moment(params.fecha, 'YYYY-MM-DD').date() - 1, 'days');
        }
        month5Ago = moment(date).subtract(4, 'months').toDate();
        nextMonth = moment(date).add(1, 'months').toDate();

        jsonParam = [
            {$match: { 'fecha.emision': {$gte: month5Ago, $lt: nextMonth} }},
            { $project: {
                accessDate: {$subtract: ['$fecha.emision', 180 * 60 * 1000]},
                dia: {$dateToString: { format: "%Y%m", date: {$subtract: ['$fecha.emision', 180 * 60 * 1000]} }},
                terminal: '$terminal',
                total: 1}},
            { $group : {
                _id : { terminal: '$terminal',
                    year: { $year : "$accessDate" },
                    month: { $month : "$accessDate" },
                    dia: '$dia'
                },
                cnt : { $sum : 1 },
                total: { $sum : '$total'}
            }},
            {
                $project: {
                    _id: false,
                    terminal: '$_id.terminal',
                    year: '$_id.year',
                    month: '$_id.month',
                    dia: '$_id.dia',
                    cnt: '$cnt',
                    total: '$total'
                }
            },
            { $sort: {'dia': 1, 'terminal': 1 }}
        ];

        Invoice.aggregate(jsonParam, function (err, data) {
            if (err) {
                if (callback) return callback({status: "ERROR", data: err.message});
            } else {
                if (callback) return callback(undefined, {status: 'OK', data: data});
            }
        });
    }

    getCashbox (param, callback) {
        var usr = param.usr;
        var moment = require('moment');

        var fecha;

        var params = {terminal: param.terminal};

        if (param.fechaInicio || param.fechaFin) {
            params["fecha.emision"] = {};
            if (param.fechaInicio) {
                fecha = moment(param.fechaInicio, 'YYYY-MM-DD').toDate();
                params["fecha.emision"].$gte = fecha;
            }
            if (param.fechaFin) {
                fecha = moment(param.fechaFin, 'YYYY-MM-DD').toDate();
                params["fecha.emision"].$lte = fecha;
            }
        }
        if (param.nroPtoVenta) {
            params.nroPtoVenta = param.nroPtoVenta;
        }
        if (param.codTipoComprob) {
            params.codTipoComprob = param.codTipoComprob;
        }
        if (param.nroComprobante) {
            params.nroComprob = param.nroComprobante;
        }
        if (param.razonSocial) {
            params.razon = {$regex: param.razonSocial};
        }
        if (param.documentoCliente) {
            params.nroDoc = param.documentoCliente;
        }

        if (param.contenedor) {
            params['detalle.contenedor'] = param.contenedor;
        }

        if (param.buqueNombre) {
            params['detalle.buque.nombre'] = param.buqueNombre;
        }

        if (param.viaje) {
            params['detalle.buque.viaje'] = param.viaje;
        }

        if (param.code) {
            params['detalle.items.id'] = param.code;
        }

        if (param.resend) {
            params.resend = param.resend;
        }

        if (param.estado){
            var states = param.estado.split(",");
            params['$or'] = [
                { estado:{$size: 1, $elemMatch: {estado: {$in: states}, grupo:'ALL'} } },
                { 'estado.1': { $exists: true } , estado: {$elemMatch: {estado: {$in: states}, grupo: usr.group} } }
            ];
        }

        this.model.distinct('nroPtoVenta', params, function (err, data){
            if (err){
                callback(err);
            } else {
                callback(undefined, data);
            }
        });
    }

    getCorrelative (params, callback) {
        callback();
    }

    getDistinct (distinct, params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };

        this.model.distinct(distinct, jsonParam, function (err, data) {
            if (err) {
                if (callback) return callback({status: "ERROR", message: err.message, data: err});
            } else {
                data = data.sort();
                if (callback) return callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                });
            }
        });
    }

    getNoRates (params, callback) {
        var terminal = params.terminal,
            _price = require('../lib/price.js'),
            Invoice = this.model,
            _rates,
            skip,
            limit,
            fecha,
            param,
            invoices,
            errorResult;

        _rates = new _price(terminal);

        _rates.rates(function (err, rates) {

            if (rates.length > 0) {

                skip = parseInt(params.skip, 10);
                limit = parseInt(params.limit, 10);


                param = {
                    terminal : terminal,
                    'detalle.items.id': {$nin: rates}
                };

                if (params.fechaInicio || params.fechaFin) {
                    param["fecha.emision"] = {};
                    if (params.fechaInicio) {
                        fecha = moment(moment(params.fechaInicio, 'YYYY-MM-DD')).toDate();
                        param["fecha.emision"]['$gte'] = fecha;
                    }
                    if (params.fechaFin) {
                        fecha = moment(moment(params.fechaFin, 'YYYY-MM-DD')).toDate();
                        param["fecha.emision"]['$lte'] = fecha;
                    }
                }

                if (params.contenedor) {
                    param['detalle.contenedor'] = params.contenedor;
                }

                if (params.razonSocial) {
                    param.razon = {$regex: params.razonSocial};
                }

                invoices = Invoice.find(param);
                invoices.limit(limit).skip(skip);

                if (params.order) {
                    var order = JSON.parse(params.order);
                    invoices.sort(order[0]);
                } else {
                    invoices.sort({codTipoComprob: 1, nroComprob: 1});
                }
                invoices.lean();
                invoices.exec(function (err, invoices) {
                    var pageCount = invoices.length;
                    Invoice.count(param, function (err, cnt) {
                        var dataResult = {
                            status: 'OK',
                            totalCount: cnt,
                            pageCount: (limit > pageCount) ? limit : pageCount,
                            page: skip,
                            data: invoices
                        };
                        if (callback) return callback(undefined, dataResult);
                    });
                });
            } else {
                errorResult = {
                    status: 'ERROR',
                    data: 'La terminal no tiene Tasa a las Cargas Asociadas.'
                };
                if (callback) return callback(errorResult);
            }
        });

    }

    getNoMatches (params) {
        var promise = new Promise((resolve, reject) => {
            var moment = require('moment');

            var paramTerminal = params.terminal,
                skip = params.skip,
                limit = params.limit,
                param = [
                    {
                        $match: {terminal: paramTerminal }
                    },
                    {$unwind: '$match'},
                    {$project: {match: '$match', _id: 0}}
                ],
                s,
                parametro,
                fecha,
                match = {
                    terminal: paramTerminal
                },
                inv;

            s = this.matchPrice.aggregate(param);
            s.exec((err, noMatches) => {
                if (!err) {
                    var arrResult = noMatches.map(item => {
                        return item.match;
                    });

                    if (params.fechaInicio || params.fechaFin) {
                        match["fecha.emision"] = {};
                        if (params.fechaInicio) {
                            fecha = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
                            match["fecha.emision"]['$gte'] = fecha;
                        }
                        if (params.fechaFin) {
                            fecha = moment(params.fechaFin, 'YYYY-MM-DD').toDate();
                            match["fecha.emision"]['$lte'] = fecha;
                        }
                    }

                    parametro = [
                        { $match: match},
                        { $unwind: "$detalle"},
                        { $unwind: "$detalle.items"},
                        { $project: { code: '$detalle.items.id'}},
                        { $match: {code: {$nin: arrResult}}},
                        { $group: {_id: { _id: "$_id"}}},
                        { $skip : skip},
                        { $limit : limit}
                    ];

                    inv = this.model.aggregate(parametro);
                    inv.exec((err, data) => {
                        var ids = data.map(item => {
                            return  item._id._id;
                        });
                        if (!err) {
                            if (data.length > 0) {
                                inv._pipeline.splice(6, 2);
                                inv.group({_id: null, cnt: {$sum: 1}});
                                inv.exec((err, data2) => {

                                    this.model.find({_id : {$in: ids}}, (err, invoices) => {
                                        var cnt = data2[0].cnt,
                                            pageCount = data.length,
                                            result = {
                                                status: 'OK',
                                                totalCount: cnt,
                                                pageCount: (limit > pageCount) ? limit : pageCount,
                                                page: skip,
                                                data: invoices
                                            };
                                        resolve(result);
                                    });
                                });
                            } else {
                                resolve({ status: 'OK', data: null });
                            }
                        }
                    });
                } else {
                    log.logger.error('%s', err);
                    reject({status: 'ERROR', data: err.message});
                }
            });
        });
        return promise;
    }

    getContainersNoRates (params, callback) {

        var terminal = params.terminal,
            _price = require('../lib/price.js'),
            _rates,
            paramTotal,
            Enumerable = require("linq"),
            moment = require('moment'),
            inv,
            task,
            tasks = [],
            Invoice = this.model,
            async = require("async");

        _rates = new _price(terminal);

        _rates.rates(function (err, rates) {

            var param = {
                    terminal : terminal,
                    codTipoComprob : 1
                },
                fecha = '';

            task = function (asyncCallback) {

                if (params.razonSocial) {
                    param.razon = {$regex: params.razonSocial}
                }

                paramTotal = [
                    { $match: param },
                    { $project : {'detalle.items.id': 1, 'detalle.contenedor': 1, _id: 0}},
                    { $unwind: '$detalle' },
                    { $unwind: '$detalle.items' },
                    { $match: {'detalle.items.id' : {$in: rates }}},
                    { $group: {_id: {cont: '$detalle.contenedor'}}},
                    { $project : {_id: false, c: '$_id.cont'} }
                ];

                inv = Invoice.aggregate(paramTotal);
                inv.exec(function (err, data1) {
                    if (err) {
                        asyncCallback(err);
                    } else {
                        let contes = Enumerable.from(data1).select('$.c');
                        asyncCallback(undefined, contes);
                    }
                });
            };
            tasks.push(task);

            task = function (asyncCallback) {
                //Solo filtra fecha de este lado, en el aggregate trae todas las tasas a las cargas de contenedor históricas.
                if (params.fechaInicio || params.fechaFin) {
                    param["fecha.emision"] = {};
                    if (params.fechaInicio) {
                        fecha = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
                        param["fecha.emision"]['$gte'] = fecha;
                    }
                    if (params.fechaFin) {
                        fecha = moment(params.fechaFin, 'YYYY-MM-DD').toDate();
                        param["fecha.emision"]['$lte'] = fecha;
                    }
                }

                Invoice.aggregate([
                    {$match: param},
                    {$unwind: '$detalle'},
                    {$group: {_id: {contenedor: '$detalle.contenedor'}}},
                    {$project: {contenedor: '$_id.contenedor', _id: false}}
                ])
                .exec((err, data2) => {

                    if (err) {
                        asyncCallback(err)
                    } else {
                        let contDist = Enumerable.from(data2).select('$.contenedor');
                        asyncCallback(undefined, contDist)
                    }
                });
            };
            tasks.push(task);

            async.parallel( tasks, function (err, data) {

                if (err) {
                    callback({status: 'ERROR', message: err.message, data: err});
                } else {
                    let contes = data[0];
                    let contDist = data[1];

                    console.log(contes.toArray().length)
                    console.log(contDist.toArray().length)

                    let dife = contDist.except(contes)
                        .orderBy()
                        .toArray();
                    callback(undefined, {status: 'OK', totalCount: dife.length, data: dife});
                }
            });
        });
    }

    getShips (params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };

        this.model.distinct('buque', jsonParam, (err, data) => {
            if (err) {
                if (callback) callback({status: "ERROR", message: err.message, data: err});
            } else {
                data = data.sort();
                if (callback) callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                });
            }
        });
    }

    getShipContainers (params, callback) {
        var param,
            ter,
            query,
            rates;

        var Gate = require('../models/gate');
        var VoucherType = require('../models/voucherType');
        var Price = require('../include/price.js');

        param = {
            terminal: params.terminal,
            'detalle.buque.nombre': params.buque,
            'detalle.buque.viaje': params.viaje
        };
        rates = new Price.price(params.terminal);

        VoucherType.find({type: -1}, (err, vouchertypes) => {
            if (err) {
                callback({status: 'ERROR', data: err.message});
            } else {
                let cond = vouchertypes.map(item => {
                    if (item.type === -1) {
                        return {$eq: ["$codTipoComprob", item._id]};
                    }
                });

                rates.rates((err, ratesArray) => {

                    let mayor20140801 = new Date(2014, 7, 1);
                    query = [
                        {$match: param},
                        {$unwind: '$detalle'},
                        {$match: {'fecha.emision': {$gte: mayor20140801}, 'detalle.buque.nombre': params.buque}},
                        {$unwind: '$detalle.items'},
                        {$match: {'detalle.buque.viaje': params.viaje, 'detalle.items.id': {$in: ratesArray}}},
                        {
                            $group: {
                                _id: {
                                    contenedor: '$detalle.contenedor'
                                },
                                tonelada: { $sum: {
                                    $cond: [
                                        {$or: cond},
                                        {$multiply: ['$detalle.items.cnt', -1]},
                                        '$detalle.items.cnt'
                                    ]
                                }}
                            }
                        },
                        {$project: {
                            contenedor: '$_id.contenedor',
                            toneladas: '$tonelada',
                            _id: false}},
                        {$sort: {contenedor: 1}}
                    ];

                    this.model.aggregate(query, (err, dataContainers) => {
                        if (err) {
                            callback({status: 'ERROR', data: err.message});
                        } else {

                            param = {
                                terminal: params.terminal,
                                buque: params.buque,
                                viaje: params.viaje
                            }
                            Gate.find(param, (err, dataGates) => {
                                var Enumerable,
                                    response;

                                if (err) {
                                    callback({status: 'ERROR', data: err.message});
                                } else {
                                    Enumerable = require('linq');

                                    response = Enumerable.from(dataContainers)
                                        .groupJoin(dataGates, '$.contenedor', '$.contenedor', (inner, outer) => {
                                            var result = {
                                                contenedor: '',
                                                gates: []
                                            };
                                            if (outer.getSource !== undefined) {
                                                result.gates = outer.getSource();
                                            }

                                            result.contenedor = inner;
                                            return result;
                                        }).toArray();

                                    callback(undefined, {
                                            status: 'OK',
                                            data: response
                                        });
                                }
                            });
                        }
                    });

                });
            }
        });
    }

    getTotal (params, callback) {
        var Invoice = this.model,
            invoices,
            param,
            moment = require("moment");

        param = {
            'fecha.emision': {
                $gte: moment(params.fechaInicio, ['YYYY-MM-DD']).toDate(),
                $lte: moment(params.fechaFin, ['YYYY-MM-DD']).toDate()
            }
        };

        invoices = Invoice.aggregate([
            {$match: param},
            {$project: {
                terminal: 1,
                total:1
            }},
            {$group: {
                _id: {
                    terminal: "$terminal"
                },
                total: {$sum: "$total"},
                cnt: {$sum: 1},
                avg: {$avg: "$total"}
            }},
            {$project: {
                _id: false,
                terminal: "$_id.terminal",
                total: "$total",
                cnt: '$cnt',
                avg: '$avg'
            }}
        ]);
        invoices.exec(function (err, data) {
            var result;

            result = {
                status: "OK",
                data: data
            };

            if (callback) return callback(err, result);
        });
    }

    getTotalByClient (params, options, callback) {
        var self = this,
            param,
            clientArr = [],
            Enumerable = require('linq'),
            invoices,
            paramLocal,
            Invoice = this.model,
            moment = require('moment');

        param = {
            'fecha.emision': {
                $gte: moment(params.fechaInicio, ['YYYY-MM-DD']).toDate(),
                $lte: moment(params.fechaFin, ['YYYY-MM-DD']).toDate()
            }
        };

        if (params.terminal !== undefined && params.terminal !== null) {
            param.terminal = params.terminal;
        }
        if (params.clients) {
            if (typeof clients === 'string') {
                clientArr.push(params.clients);
            } else {
                clientArr = params.clients;
            }
            param.razon = {$in: clientArr};
        }

        paramLocal = [
            {$match: param},
            {$project: {
                terminal: 1,
                razon: 1,
                cuit: '$nroDoc',
                total: 1,
                fecha: 1
            }},
            {$group: {
                _id: {
                    terminal: "$terminal",
                    razon: "$razon",
                    cuit: "$cuit"
                },
                total: {$sum: "$total"},
                max: {$max: "$total"},
                cnt: {$sum: 1},
                avg: {$avg: "$total"}
            }},
            {$project: {
                _id: false,
                terminal: "$_id.terminal",
                cuit: '$_id.cuit',
                razon: "$_id.razon",
                total: "$total",
                max: "$max",
                cnt: '$cnt',
                avg: '$avg'
            }},
            {$sort: {"total": -1}}
        ];
        if (params.top) {
            paramLocal.push({$limit: parseInt(params.top) });
        }

        invoices = Invoice.aggregate(paramLocal);

        invoices.exec(function (err, data) {
            var total,
                result,
                response;

            if (err) {
                callback(err);
            } else {
                total = Enumerable.from(data)
                    .sum('$.total');

                if (options.output === 'csv') {
                    response = "CUIT|RAZON|COMP|PROMEDIO|MAXIMA|TOTAL\n";

                    data.forEach(function (item) {
                        response = response +
                            item.cuit +
                            "|" +
                            item.razon +
                            "|" +
                            item.cnt +
                            "|" +
                            item.avg +
                            "|" +
                            item.max +
                            "|" +
                            item.total +
                            "\n";
                    });
                    callback(err, response);
                } else {
                    result = {
                        status: "OK",
                        data: data,
                        total: total,
                        totalCount: data.length
                    };
                    callback(err, result);
                }
            }
        });
    }

    getInvoicesByRatesTerminal (params, options, callback) {
        var Invoice = this.model;
        var invoices;
        var param = [];
        var response;

        param.push({$project: {
            _id: false,
            detalle: 1,
            year: {$year: '$fecha.emision'},
            month: {$month: '$fecha.emision'},
            terminal: 1
        }});
        if (params.month) {
            param.push({$match: {
                terminal: params.terminal,
                year: params.year,
                month: params.month
            }});
        } else {
            param.push({$match: {
                terminal: params.terminal,
                year: params.year
            }});
        }
        param.push({$unwind: '$detalle'});
        param.push({$unwind: '$detalle.items'});
        param.push({$group: {
            _id: {
                code: '$detalle.items.id'
            },
            total: {$sum: '$detalle.items.impTot'}
        }});
        param.push({$project: {
            _id: false,
            code: '$_id.code',
            total: '$total'
        }});
        param.push({$sort: {total: -1}});

        invoices = Invoice.aggregate(param);
        invoices.exec(function (err, data) {
            if (options.output === 'csv') {

                var matchPrice = require('../lib/matchPrice.js'),
                    param = {terminal: params.terminal};

                matchPrice = new matchPrice(params.terminal);
                matchPrice.getMatches(param, function (err, result) {
                    response = "CODE|DESCRIPCION|TOTAL\n";

                    data.forEach(function (item) {
                        response = response +
                            item.code +
                            "|" +
                            result.data[item.code] +
                            "|" +
                            item.total +
                            "\n";
                    });
                    callback(err, response);
                });
            } else {
                callback(err, data)
            }
        });
    }

    setResend (id, resend) {
        return new Promise((resolve, reject) => {
            this.model.update({$set: {resend: resend}}, {_id: id}, (err, data) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    resolve({
                        status: "OK",
                        data: data
                    });
                }
            });
        });
    }
    toString () {
        return "Invoice class on MongoDB";
    }
}

/**
 * Representa un Invoice.
 * @constructor
 * @param {object} connection - Objeto de conexion a la base de datos a implementar.
 */
class Invoice extends Constantes {
    constructor(connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new InvoiceOracle(this.connection);
            this.type = this.ORACLE;
        } else {
            this.connection = require('../models/invoice.js');
            this.clase = new InvoiceMongoDB(this.connection);
            this.type = this.MONGODB;
        }
    }

    add (param, io, callback) {
        this.clase.add(param, io, callback);
    }

    addState (params, cn) {
        return this.clase.addState(params, cn);
    }

    getInvoice (params, callback) {
        return this.clase.getInvoice(params);
    }

    getInvoices (params, callback) {
        this.clase.getInvoices(params, callback);
    }

    getCashbox (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.getCashbox(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
        return promise;
    }

    getClients (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.getClients(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
        return promise;
    }

    getContainers (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.getContainers(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
        return promise;
    }

    getCounts (params, callback) {
        this.clase.getCounts(params, callback);
    }

    getCountByDate (params, callback) {
        this.clase.getCountByDate(params, callback);
    }

    getCountByMonth (params, callback) {
        this.clase.getCountByMonth(params, callback);
    }

    getCorrelative (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.getCorrelative( params, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            });
        });
        return promise;
    }

    getDistinct (distinct, params, callback) {
        this.clase.getDistinct(distinct, params, callback);
    }

    getNoMatches (params) {
        return this.clase.getNoMatches(params);
    }

    getNoRates (params, callback) {
        this.clase.getNoRates(params, callback);
    }

    getContainersNoRates (params, callback) {
        this.clase.getContainersNoRates(params, callback);
    }

    getShips (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.getShips(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
        return promise;
    }

    getShipContainers (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.getShipContainers(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        return promise;
    }

    getTotal (params, callback) {
        this.clase.getTotal(params, callback);
    }

    getTotalByClient (params, options, callback) {

        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        this.clase.getTotalByClient(params, options, callback);
    }

    getInvoicesByRatesTerminal (params, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        this.clase.getInvoicesByRatesTerminal(params, options, callback);
    }

    setResend (id, resend) {
        return this.clase.setResend(id, resend);
    }
/*
    add (newGate, options, callback) {

        var validate = {},
            trimBody;
        newGate = JSON.parse(JSON.stringify(newGate));

        if (typeof options === 'function') {
            callback = options;
        } else if (typeof options === 'object') {
            if (options.trim) {
                trimBody = require('trim-body');
                trimBody(newGate);
            }
            if (options.validate) {
                validate = this.validate(newGate);
            }
        }
        if (validate.status === 'ERROR') {
            if (callback) return callback(validate);
        } else {
            this.clase.add(newGate, callback);
        }
    }
*/
    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }
}

module.exports = Invoice;