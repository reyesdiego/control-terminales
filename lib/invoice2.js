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

/*

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
*/

function getResultSetCB (connection, resultSet, numRows, callbackResultSet) {
    var ret = [];
    fetchRowsFromRS(connection, resultSet, numRows, ret, (err, ret, conn) => {
        if (err) {
            callbackResultSet(err);
        } else {
            callbackResultSet(undefined, ret, conn);
        }
    });
}

function fetchRowsFromRS(connection, resultSet, numRows, ret, callback) {
    resultSet.getRows( // get numRows rows
        numRows,
        function (err, rows)
        {
            if (err) {
                console.log(err);
                callback(err);
            } else if (rows.length === 0) {    // no rows, or no more rows
                callback(undefined, ret, connection);
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
        var codTipoComprob = parseInt(invoice.codTipoComprob.toString().trim(), 10);

        if (pool) {
            pool.getConnection ((err, connection ) => {
                if (err) {
                    self.cn.doRelease(connection);
                    console.log("%s, Error en Oracle Adding Invoice in OracleDb.", new Date());
                    callback({status: "ERROR", message: "Error en Oracle addInvoice", data: err});
                } else {
                    usr = invoice.usr;
                    delete invoice.usr;

                    var strVoucher = "SELECT TYPE FROM VOUCHER_TYPE WHERE ID = :1";
                    connection.execute(strVoucher, [codTipoComprob], {}, (err, result) => {
                        var voucherType = result.rows[0];

                        strSql = `insert into INVOICE_HEADER
                                (ID,
                                TERMINAL,
                                TIPO,
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
                                ) VALUES (
                                invoices_seq.nextval,
                                :terminal,
                                :tipo,
                                :codTipoComprob,
                                :nroPtoVenta,
                                :nroComprob,
                                :codTipoAutoriz,
                                :codAutoriz,
                                :codTipoDoc,
                                :nroDoc,
                                :clientId,
                                :razon,
                                :importeGravado,
                                :importeNoGravado,
                                :importeExento,
                                :importeIva,
                                :importeSubtotal,
                                :importeOtrosTributos,
                                :importeTotal,
                                :total,
                                :codMoneda,
                                :cotiMoneda,
                                :observa,
                                :codConcepto,
                                to_date(:fechaEmision, 'YYYY-MM-DD'),
                                to_date(:fechaVcto, 'YYYY-MM-DD'),
                                to_date(:fechaDesde, 'YYYY-MM-DD'),
                                to_date(:fechaHasta, 'YYYY-MM-DD'),
                                to_date(:fechaVctoPago, 'YYYY-MM-DD'),
                                :resend,
                                to_date(:registrado_en, 'YYYY-MM-DD HH24:MI:SS')
                                ) RETURNING ID INTO :outputId`;
                        param = {
                            outputId : {type: self.cn.oracledb.NUMBER, dir: self.cn.oracledb.BIND_OUT},
                            terminal: usr.terminal,
                            tipo: invoice.tipo,
                            codTipoComprob: codTipoComprob,
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

                        param.total = param.importeTotal * param.cotiMoneda * voucherType.TYPE;

                        connection.execute(strSql, param, {autoCommit: _autoCommit}, (err, result) => {
                            let error;
                            if (err) {
                                error = self.cn.error(err);
                                error.data = invoice;
                                if (error.code === 'ORA-00001') {
                                    strSql = `SELECT RESEND
                                                    FROM INVOICE_HEADER
                                                    WHERE NRO_COMPROB = ${param.nroComprob} AND
                                                          COD_TIPO_COMPROB = ${param.codTipoComprob} AND
                                                          TERMINAL = '${param.terminal}' AND
                                                          NRO_PTO_VENTA = ${param.nroPtoVenta}`;
                                    connection.execute(strSql, [], {}, (errResend, data) => {

                                        if (errResend) {
                                            self.cn.doRelease(connection);
                                            if (callback){ return callback({status: "ERROR", message: "Adding Invoice in OracleDb", data: error});}
                                        } else {
                                            if (data.rows[0].RESEND === 1) {
                                                strSql = `DELETE FROM INVOICE_HEADER
                                                            WHERE NRO_COMPROB = ${param.nroComprob} AND
                                                               COD_TIPO_COMPROB = ${param.codTipoComprob} AND
                                                               TERMINAL = '${param.terminal}' AND
                                                               NRO_PTO_VENTA = ${param.nroPtoVenta}`;
                                                connection.execute(strSql, [], {autoCommit: true}, err => {
                                                    if (err) {
                                                        self.cn.doRelease(connection);
                                                        if (callback) {return callback({status: "ERROR", message: "Adding Invoice in OracleDb", data: error});}
                                                    } else {
                                                        self.add(invoice, io, callback);
                                                    }

                                                });
                                            } else {
                                                self.cn.doRelease(connection);
                                                if (callback) {return callback({status: "ERROR", message: error.message, data: error.data});}
                                            }
                                        }
                                    });
                                } else {
                                    self.cn.doRelease(connection);
                                    if (callback) { return callback({status: "ERROR", message: error.message, data: error.data}); }
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
                                                    strSql = `insert into INVOICE_DETAIL
                                                                    (ID,
                                                                    INVOICE_HEADER_ID,
                                                                    CONTENEDOR,
                                                                    IMO,
                                                                    ISO,
                                                                    BUQUE_CODIGO,
                                                                    BUQUE_NOMBRE,
                                                                    BUQUE_VIAJE,
                                                                    BUQUE_FECHA,
                                                                    CODE,
                                                                    CNT,
                                                                    UNI_MED,
                                                                    IMP_UNIT,
                                                                    IMP_TOT
                                                                    ) VALUES (
                                                                    invoices_seq.nextval,
                                                                    :INVOICE_HEADER_ID,
                                                                    :CONTENEDOR,
                                                                    :IMO,
                                                                    :ISO,
                                                                    :BUQUE_CODIGO,
                                                                    :BUQUE_NOMBRE,
                                                                    :VIAJE,
                                                                    :FECHA,
                                                                    :CODE,
                                                                    :CNT,
                                                                    :UNIMED,
                                                                    :IMPUNIT,
                                                                    :IMPTOT)`;

                                                    let buqueId = (detalle.buqueId !== undefined && detalle.buqueId !== null) ? detalle.buqueId.toString() : "";
                                                    let buqueDesc = (detalle.buqueDesc !== undefined && detalle.buqueDesc !== null) ? detalle.buqueDesc.trim() : "";
                                                    let viaje = (detalle.viaje !== undefined && detalle.viaje !== null) ? detalle.viaje.trim() : "";
                                                    let fecha = (detalle.fecha !== undefined && detalle.fecha !== "" && detalle.fecha !== null) ? moment(detalle.fecha, "YYYY-MM-DD") : "";

                                                    let isoChecked = null;
                                                    if (detalle.iso !== undefined && detalle.iso !== null && !isNaN(parseInt(detalle.iso.substr(0,1)))) {
                                                        isoChecked = detalle.iso;
                                                    }
                                                    param = {
                                                        INVOICE_HEADER_ID: result.outBinds.outputId[0],
                                                        CONTENEDOR: (detalle.contenedor) ? detalle.contenedor.trim() : "",
                                                        IMO: (detalle.IMO !== undefined) ? detalle.IMO : 0,
                                                        ISO: isoChecked,
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
                                            if (callback) {return callback({
                                                status: "ERROR",
                                                message: errMsg,
                                                data: invoice
                                            });}
                                        }
                                    });

                                } else {
                                    self.cn.doRelease(connection);
                                    //Verifica que haya Detalle, sino retorna ERROR
                                    let errMsg = util.format("El Comprobante no posee Detalles. %s, %j", usr.terminal, invoice);
                                    if (callback) {
                                        return callback({
                                            status: "ERROR",
                                            message: errMsg,
                                            data: invoice
                                        });
                                    }
                                }

                                if ((subTotalCheck > invoice.impSubtot + 2) || (subTotalCheck < invoice.impSubtot - 2)) {
                                    comment = `El subtotal del comprobante es incorrecto, la suma es ${subTotalCheck} y se informa ${invoice.impSubtot}. - ${usr.terminal}.`;
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

                                async.parallel(tasks, (err, data) => {
                                    if (err) {
                                        connection.rollback(errRollback => {
                                            self.cn.doRelease(connection);
                                            if (callback) { return callback({
                                                status: "ERROR",
                                                data: self.cn.error(err)
                                            }); }
                                        });
                                    } else {

                                        connection.commit(errCommit => {
                                            if (errCommit) {
                                                if (callback) {return callback({
                                                    status: "ERROR",
                                                    data: self.cn.error(errCommit)
                                                });}
                                            } else {

                                                strSql = `DECLARE R VARCHAR2(20);
                                                            BEGIN
                                                              SELECT MOV
                                                                INTO R
                                                                FROM (
                                                                 SELECT SUBSTR( T.RATE || T.MOV, 0, 4) AS MOV, COUNT(SUBSTR( T.RATE || T.MOV, 0, 4)) AS CNT
                                                                  FROM TARIFARIO_TERMINAL TT
                                                                      INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                                                                  WHERE MOV IS NOT NULL AND
                                                                    TT.CODE IN ( SELECT DISTINCT CODE FROM INVOICE_DETAIL WHERE INVOICE_HEADER_ID = :1 )
                                                                  GROUP BY SUBSTR( T.RATE || T.MOV, 0, 4)
                                                                  ORDER BY COUNT(SUBSTR( T.RATE || T.MOV, 0, 4)) DESC
                                                                ) WHERE ROWNUM = 1;

                                                              UPDATE INVOICE_HEADER
                                                              SET TIPO = R
                                                              WHERE ID = :1;
                                                            END;`;

                                                connection.execute(strSql, [param._id], {autoCommit: true}, (err, data ) => {
                                                    self.cn.doRelease(connection);
                                                });

                                                if (callback) {return callback(undefined, {
                                                    status: "OK", data: param
                                                });}
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

    setSize (container, size) {
        return new Promise((resolve, reject) => {
            var strSql;
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add Gate.", new Date());
                        reject(err);
                    } else {
                        strSql = `UPDATE INVOICE_DETAIL
                                    SET LARGO = :1
                                    WHERE CONTENEDOR = :2`;
                        connection.execute(strSql, [size, container], {autoCommit: true}, (err, data) => {
                            var response;
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                response = {
                                    status: 'OK',
                                    data: {}
                                };
                                resolve(response);
                            }
                        });
                    }
                });
            }
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
                taskAsync = asyncCallback => {
                    pool.getConnection((err, connection) => {
                        if (err) {
                            console.log("%s, Error en Oracle getInvoice.", new Date());
                            self.cn.doRelease(connection);
                            reject({status: "ERROR", message: "Error en Oracle getInvoice", data: err});
                        } else {

                            strSql = `SELECT ID,
                                       TIPO,
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
                            connection.execute(strSql, [params._id], {}, (err, data) => {
                                self.cn.doRelease(connection);
                                if (err) {
                                    return asyncCallback(err);
                                } else {
                                    if (data.rows) {
                                        data = data.rows.map(item => ({
                                            _id: item.ID,
                                            tipo: item.TIPO,
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
                                        }));
                                    }
                                    return asyncCallback(undefined, data[0]);
                                }
                            });
                        }
                    });
                };
                tasksAsync.push(taskAsync);

                taskAsync = asyncCallback => {
                    pool.getConnection((err, connection) => {
                        if (err) {
                            console.log("%s, Error en Oracle getInvoice.", new Date());
                            self.cn.doRelease(connection);
                            reject ({status: "ERROR", message: "Error en Oracle getInvoice", data: err});
                        } else {

                            strSql =  `SELECT D.ID,
                                        INVOICE_HEADER_ID,
                                        CONTENEDOR,
                                        ISO,
                                        IMO,
                                        BUQUE_CODIGO,
                                        BUQUE_NOMBRE,
                                        BUQUE_VIAJE,
                                        BUQUE_FECHA,
                                        D.CODE,
                                        T.DESCRIPCION,
                                        T.RATE,
                                        CNT,
                                        UNI_MED,
                                        IMP_UNIT,
                                        IMP_TOT
                                        FROM INVOICE_DETAIL D
                                            INNER JOIN INVOICE_HEADER H ON H.ID = D.INVOICE_HEADER_ID
                                            LEFT JOIN TARIFARIO_TERMINAL TT ON TT.CODE = D.CODE AND TT.TERMINAL = H.TERMINAL
                                            LEFT JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                                        WHERE INVOICE_HEADER_ID = :1`;
                            connection.execute(strSql, [params._id], {}, (err, data) => {
                                self.cn.doRelease(connection);
                                if (err) {
                                    return asyncCallback(err);
                                } else {
                                    var deta1 = [];
                                    if (data.rows) {
                                        deta1 = Enumerable.from(data.rows)
                                            .groupBy('x=>JSON.stringify({' +
                                            'CONTENEDOR: x.CONTENEDOR, ' +
                                            'ISO: x.ISO, ' +
                                            'BUQUE_NOMBRE: x.BUQUE_NOMBRE, ' +
                                            'BUQUE_VIAJE: x.BUQUE_VIAJE,' +
                                            'BUQUE_FECHA: x.BUQUE_FECHA})', null, (key, g) => {
                                                key = JSON.parse(key);
                                                var deta = {
                                                    contenedor: key.CONTENEDOR,
                                                    iso: key.ISO,
                                                    buque: {
                                                        nombre: key.BUQUE_NOMBRE,
                                                        viaje: key.BUQUE_VIAJE,
                                                        fecha: key.BUQUE_FECHA
                                                    }
                                                };
                                                deta.items = Enumerable.from(g.getSource())
                                                    .select(item => ({
                                                        id: item.CODE,
                                                        cnt: item.CNT,
                                                        description: item.DESCRIPCION,
                                                        rate: item.RATE,
                                                        impTot: item.IMP_TOT,
                                                        impUnit: item.IMP_UNIT,
                                                        uniMed: item.UNI_MED
                                                    })).toArray();
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

                async.parallel(tasksAsync, (err, data) => {
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
                    if (callback) { return callback(err); }
                } else {

                    if (params.order) {
                        orderBy = this.cn.orderBy(params.order).toUpperCase();
                        var order = (orderBy.includes('ASC')) ? ' ASC' : ' DESC';
                        if (orderBy.includes('NROPTOVENTA')) {
                            orderBy = 'NRO_PTO_VENTA';
                        }
                        else if (orderBy.includes('CODTIPOCOMPROB')) {
                            orderBy = 'COD_TIPO_COMPROB';
                        }
                        else if (orderBy.includes('RAZON')) {
                            orderBy = 'RAZON';
                        }
                        else if (orderBy.includes('NROCOMPROB')) {
                            orderBy = 'NRO_COMPROB';
                        }
                        else if (orderBy.includes('FECHA.EMISION')) {
                            orderBy = 'FECHA_EMISION';
                        }
                        else if (orderBy.includes('IMPORTE.TOTAL')) {
                            orderBy = 'TOTAL';
                        }

                        orderBy += order;
                    }

                    if (params.terminal) {
                        strWhere += util.format(" IH.TERMINAL = '%s' AND ", params.terminal);
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
                    if (params.estado) {
                        strWhere += util.format(" STATE IN (%s) AND ", params.estado.split(',').map(state => (`'${state}'`)));
                    }
                    if (params.resend) {
                        strWhere += util.format(" RESEND = %s AND ", params.resend);
                    }
                    //DETAIL
                    if (params.contenedor) {
                        strWhereExists += util.format(" CONTENEDOR = '%s' AND ", params.contenedor);
                    }
                    if (params.iso3Forma) {
                        strWhereExists += util.format(" FORMA = '%s' AND ", params.iso3Forma);
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
                        strWhereExists = util.format('( SELECT * FROM INVOICE_DETAIL I LEFT JOIN ISO3 ON SUBSTR(I.ISO, 3,1) = ISO3.ID WHERE IH.ID = INVOICE_HEADER_ID AND %s )', strWhereExists.substr(0, strWhereExists.length - 4));
                        strWhere += util.format(" EXISTS %s AND ", strWhereExists);
                    }

                    if (strWhere.length > 0) {
                        strWhere = util.format(" WHERE %s ", strWhere.substr(0, strWhere.length - 4));
                    }

                    taskAsync = asyncCallback => {
                        strSql = `SELECT I.*
                                    FROM (SELECT IH.ID,
                                            TIPO,
                                            IH.TERMINAL,
                                            COD_TIPO_COMPROB,
                                            NRO_PTO_VENTA,
                                            RAZON,
                                            FECHA_EMISION,
                                            NRO_COMPROB,
                                            IMPORTE_TOTAL,
                                            TOTAL,
                                            CONTES,
                                            COTI_MONEDA,
                                            COD_MONEDA,
                                            RESEND,
                                            USR,
                                            GRUPO,
                                            STATE,
                                            PAYMENT_ID,
                                            PAYMENT_PRE_NUMBER,
                                            PAYMENT_NUMBER,
                                            ROW_NUMBER() OVER (ORDER BY ${orderBy} ) R
                                            FROM INVOICE_HEADER  IH
                                                 INNER JOIN INVOICE_STATE STA ON  IH.ID = STA.INVOICE_HEADER_ID AND
                                                                                STA.ID = (SELECT MAX(ST1.ID) FROM INVOICE_STATE ST1 WHERE ST1.INVOICE_HEADER_ID = IH.ID)
                                                 LEFT JOIN PAYMENT P ON IH.PAYMENT_ID = P.ID
                                                 INNER JOIN (SELECT INVOICE_HEADER_ID, COUNT(DISTINCT CONTENEDOR) CONTES FROM INVOICE_DETAIL GROUP BY INVOICE_HEADER_ID) CONTE
                                                        ON CONTE.INVOICE_HEADER_ID = IH.ID
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
                                        contes: item.CONTES,
                                        total: item.TOTAL,
                                        coti_moneda: item.COTI_MONEDA,
                                        codMoneda: item.COD_MONEDA,
                                        fecha: {emision: item.FECHA_EMISION},
                                        nroPtoVenta: item.NRO_PTO_VENTA,
                                        resend: item.RESEND,
                                        tipo: item.TIPO,
                                        estado: {
                                            state: item.STATE,
                                            group: item.GRUPO,
                                            user: item.USR
                                        },
                                        payment: {
                                            preNumber: item.PAYMENT_PRE_NUMBER,
                                            number: item.PAYMENT_NUMBER
                                        }
                                    }));
                                }
                                asyncCallback(undefined, result);
                            }
                        });
                    };
                    tasksAsync.push(taskAsync);

                    taskAsync = asyncCallback => {
                        strSql = `SELECT COUNT(*) as CNT, sum(case when cod_moneda = 'PES' then importe_total else 0 end) as pesos, sum(case when cod_moneda = 'DOL' then importe_total else 0 end) as dolares
                                            FROM INVOICE_HEADER  IH
                                                 INNER JOIN INVOICE_STATE STA ON  IH.ID = STA.INVOICE_HEADER_ID AND
                                                                                STA.ID = (SELECT MAX(ST1.ID) FROM INVOICE_STATE ST1 WHERE ST1.INVOICE_HEADER_ID = IH.ID)
                                            %s `;

                        strSql = util.format(strSql, strWhere);

                        connection.execute(strSql, [], {}, (err, data) => {
                            if (err) {
                                asyncCallback(err);
                            } else {
                                let dolares = 0;
                                let pesos = 0;
                                let cnt = 0;
                                if (data.rows) {
                                    cnt = data.rows[0].CNT;
                                    dolares = data.rows[0].DOLARES;
                                    pesos = data.rows[0].PESOS;
                                }
                                asyncCallback(undefined, {cnt: cnt, dolares: dolares, pesos: pesos});
                            }
                        });
                    };
                    tasksAsync.push(taskAsync);

                    async.parallel(tasksAsync, (err, data) => {
                        this.cn.doRelease(connection);
                        if (err) {
                            if (callback){
                                return callback({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err});
                            }
                        } else {
                            var invoices = data[0];
                            if (invoices) {
                                invoices.totalCount = data[1].cnt;
                                invoices.dolares = data[1].dolares;
                                invoices.pesos = data[1].pesos;
                                if (callback) { return callback(undefined, invoices); }
                            } else {
                                if (callback) { return callback({status: "ERROR", message: "ERROR en getInvoices"}); }
                            }
                        }
                    });
                }
            });
        } else {
            callback({
                status: "ERROR",
                message: "Error en el Servidor de Base de Datos"
            });
        }
    }

    getInvoicesCSV (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var util = require('util');
            var pool = this.cn.pool;

            var strSql,
                strWhere = '',
                strWhereExists = '';
            var arr = [];

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getInvoices.", new Date());
                        this.cn.doRelease(connection);
                        reject(err);
                    } else {

                        if (params.terminal) {
                            strWhere += util.format(" VHD.TERMINAL = '%s' AND ", params.terminal);
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
                        //DETAIL
                        if (params.contenedor) {
                            strWhere += util.format(" CONTENEDOR = '%s' AND ", params.contenedor);
                        }
                        if (params.iso3Forma) {
                            strWhere += util.format(" FORMA = '%s' AND ", params.iso3Forma);
                        }
                        if (params.buqueNombre) {
                            strWhere += util.format(" BUQUE_NOMBRE = '%s' AND ", params.buqueNombre);
                        }
                        if (params.viaje) {
                            strWhere += util.format(" BUQUE_VIAJE = '%s' AND ", params.viaje);
                        }
                        if (params.code) {
                            strWhere += util.format(" CODE = '%s' AND ", params.code);
                        }

                        //if (strWhereExists.length > 0) {
                        //    strWhereExists = util.format('( SELECT * FROM INVOICE_DETAIL I LEFT JOIN ISO3 ON SUBSTR(I.ISO, 3,1) = ISO3.ID WHERE IH.ID = INVOICE_HEADER_ID AND %s )', strWhereExists.substr(0, strWhereExists.length - 4));
                        //    strWhere += util.format(" EXISTS %s AND ", strWhereExists);
                        //}

                        if (strWhere.length > 0) {
                            strWhere = util.format(" WHERE %s ", strWhere.substr(0, strWhere.length - 4));
                        }


                        strSql = `SELECT
                                TERMINAL,
                                TIPO,
                                COD_TIPO_COMPROB,
                                NRO_PTO_VENTA,
                                NRO_COMPROB,
                                RAZON,
                                IMPORTE_TOTAL,
                                TOTAL,
                                COD_MONEDA,
                                COTI_MONEDA,
                                FECHA_EMISION,
                                CONTENEDOR,
                                BUQUE_NOMBRE,
                                BUQUE_VIAJE,
                                BUQUE_FECHA,
                                CODE,
                                CNT,
                                IMP_UNIT,
                                IMP_TOT,
                                ISO
                            FROM V_INVOICE_HEADER_DETAIL VHD %s`;

                        strSql = util.format(strSql, strWhere);
                        var stream = connection.queryStream(strSql);

                        stream.on('error', function (error) {
                            // console.log("stream 'error' event");
                            console.error(error);
                            return;
                        });

                        stream.on('metadata', function (metadata) {
                            arr.push("TIPO|COD_TIPO_COMPROB|NRO_PTO_VENTA|NRO_COMPROB|RAZON|IMPORTE_TOTAL|TOTAL|COD_MONEDA|COTI_MONEDA|FECHA_EMISION|CONTENEDOR|BUQUE_NOMBRE|BUQUE_VIAJE|BUQUE_FECHA|CODE|CNT|IMP_UNIT|IMP_TOT|ISO");
                        });

                        stream.on('data', data => {
                            arr.push(`${data.TIPO}|${data.COD_TIPO_COMPROB}|${data.NRO_PTO_VENTA}|${data.NRO_COMPROB}|${data.RAZON}|${data.IMPORTE_TOTAL}|${data.TOTAL}|${data.COD_MONEDA}|${data.COTI_MONEDA}|${data.FECHA_EMISION}|${data.CONTENEDOR}|${data.BUQUE_NOMBRE}|${data.BUQUE_VIAJE}|${data.BUQUE_FECHA}|${data.CODE}|${data.CNT}|${data.IMP_UNIT}|${data.IMP_TOT}|${data.ISO}`);
                        });

                        stream.on('end', function () {
                            connection.close(
                                function(err) {
                                    if (err) {
                                        console.error(err.message);
                                    }
                                });
                            resolve({
                                status: "OK",
                                data: arr.join('\n')
                            });
                        });
                    }
                });
            }
        });
    }

    getClients (params, callback) {
        var self = this;
        var strSql;
        var pool = self.cn.pool;

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    self.cn.doRelease(connection);
                    if (callback) { return callback(err); }
                } else {
                    strSql = `SELECT DISTINCT RAZON FROM INVOICE_HEADER WHERE TERMINAL = :1 ORDER BY RAZON`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY, resultSet: true}, (err, data) => {
                        if (err) {
                            if (callback) { return callback({status: "ERROR", message: err.message, data: err}); }
                        } else {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {
                                    resultSet.close(err=> {
                                        this.cn.doRelease(connection);
                                    });
                                    if (callback) { return callback(undefined, {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data.map(item => {return item[0];})
                                    }); }
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
                    if (callback) { return callback(err); }
                } else {
                    strSql = `SELECT DISTINCT CONTENEDOR
                            FROM INVOICE_DETAIL IND
                                INNER JOIN INVOICE_HEADER INH ON IND.INVOICE_HEADER_ID = INH.ID
                            WHERE TERMINAL = :1 ORDER BY CONTENEDOR`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY, resultSet: true}, (err, data) => {
                        if (err) {
                            if (callback) { return callback({status: "ERROR", message: err.message, data: err}); }
                        } else {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {
                                    resultSet.close(err=> {
                                        this.cn.doRelease(connection);
                                    });
                                    if (callback) {return callback(undefined, {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data.map(item => {return item[0];})
                                    });}
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
            pool.getConnection ((err, connection) => {
                if (err) {
                    console.log("%s, Error en Oracle getCounts.", new Date());
                    self.cn.doRelease(connection);
                } else {

                    fechaEmision = moment().format('YYYY-MM-DD');

                    if (params.fecha !== undefined) {
                        fechaEmision = moment(params.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
                    }

                    strSql = `SELECT TERMINAL, COD_TIPO_COMPROB, DESCRIPTION, SUM(TOTAL) as TOTAL, COUNT(*) as CNT
                        FROM INVOICE_HEADER H
                            INNER JOIN VOUCHER_TYPE V ON H.COD_TIPO_COMPROB = V.ID
                        WHERE FECHA_EMISION = TO_DATE(:1,'YYYY-MM-DD')
                        GROUP BY TERMINAL, COD_TIPO_COMPROB, DESCRIPTION`;

                    connection.execute(strSql, [fechaEmision], {}, (err, data) => {
                        self.cn.doRelease(connection);
                        if (err) {
                            callback({status: "ERROR", message: err.message, data: err});
                        } else {

                            response = Enumerable.from(data.rows)
                                .groupBy('x=>JSON.stringify({cod: x.COD_TIPO_COMPROB, desc: x.DESCRIPTION})',
                                    item => {
                                    return item;
                                },
                                (job, grouping) => {
                                    let key = JSON.parse(job);

                                    var grupo = grouping.getSource(),
                                        cnt = grouping.sum(item => {
                                            return item.CNT;
                                        }),
                                        tot = grouping.sum(item => {
                                            return item.TOTAL;
                                        }),
                                        grupoItem = {
                                            codTipoComprob: key.cod,
                                            description: key.desc,
                                            cnt: cnt,
                                            total: tot
                                        };

                                    grupo.forEach(item => {
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
        callback({
            status: "ERROR",
            message: "NOT IMPLEMENTED - Movido a MicroService micro-statistic"
        });
    }

    getCountByMonth (params, callback) {
        callback({
            status: "ERROR",
            message: "NOT IMPLEMENTED - Movido a MicroService micro-statistic"
        });

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
                '%s ';
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
                                puntos = data.rows.map(item => (item.NRO_PTO_VENTA));
                            }
                            callback (undefined, puntos);
                        }
                    });
                }
            });
        } else {
            callback({
                status: "ERROR",
                message: "Error en el Servidor de Base de Datos"
            });
        }
    }

    getCorrelative (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var moment = require('moment');
            var Enumerable = require('linq');
            var param;


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
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err});
                    } else {
                        strSql = `BEGIN sp_correlative_NEW(:P_TERMINAL, :P_COD_TIPO_COMPROB, :P_INICIO, :P_FIN, :RESULT_CURSOR); END;`;
                        param = {
                            P_TERMINAL: params.terminal,
                            P_COD_TIPO_COMPROB: params.codTipoComprob,
                            P_INICIO: params.fechaInicio,
                            P_FIN: params.fechaFin,
                            RESULT_CURSOR: {type: this.cn.oracledb.CURSOR, dir: this.cn.oracledb.BIND_OUT}
                        };

                        let result;

                        connection.execute(strSql, param, {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                let rSet = data.outBinds.RESULT_CURSOR;
                                getResultSetCB(connection, rSet, 1000, (err, data, connect) => {
                                    if (err) {
                                        rSet.close(err => {
                                            console.error(err);
                                            this.cn.doRelease(connection);
                                        });
                                        resolve({
                                            status: "ERROR",
                                            message: err.message,
                                            data: err
                                        });
                                    } else {

                                        rSet.close(err => {
                                            this.cn.doRelease(connection);
                                        });
                                        //var total = Enumerable.from(data).sum('x=>x.RES');
                                        data = Enumerable.from(data)
                                            .select(item => {
                                                let objResult;
                                                if (item.RES > 1) {
                                                    objResult = {res: item.RES, v: item.NRO_PTO_VENTA, n: `[${item.STA} a ${item.STO}] (${item.RES})`, d: item.FECHA};
                                                } else if (item.RES === 1) {
                                                    objResult = {res: item.RES, v: item.NRO_PTO_VENTA, n: item.STA, d: item.FECHA};
                                                }
                                                return objResult;
                                            })
                                            .groupBy('$.v', "", (key, g) => {
                                                let prop = g.getSource();
                                                return {
                                                    nroPtoVenta: key,
                                                    totalCount: g.sum('$.res'),
                                                    data: prop.map(item => ({
                                                        n: item.n,
                                                        d: item.d
                                                    }))};
                                            }).toArray();
                                        resolve({
                                            status: "OK",
                                            codTipoComprob: params.codTipoComprob,
                                            data: data
                                        })
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getDistinct (distinct, params, callback) {
        var self = this;
        var strSql;
        var pool = self.cn.pool;

        if (pool) {
            pool.getConnection((err, connection) => {
                if (err) {
                    self.cn.doRelease(connection);
                    if (callback) { return callback(err); }
                } else {
                    strSql = `SELECT DISTINCT ${distinct} FROM INVOICE_HEADER WHERE TERMINAL = :1 ORDER BY ${distinct}`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY}, (err, data) => {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) { return callback({status: "ERROR", message: err.message, data: err}); }
                        } else {
                            let result = data.rows.map(item => {return item[0];});
                            if (callback) { return callback(undefined, {
                                status: "OK",
                                totalCount: result.length,
                                data: result
                            }); }
                        }
                    });
                }
            });
        }
    }

    getLastInsert (terminal, lastHours) {
        return new Promise((resolve, reject) => {
            var strSql;
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({
                            status: 'ERROR',
                            message: err.message,
                            data: err
                        });
                    } else {
                        strSql = `SELECT MAX(REGISTRADO_EN) REGISTRADO_EN FROM INVOICE_HEADER WHERE TERMINAL = :1`;
                        connection.execute(strSql, [terminal], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                let moment = require('moment');
                                let result = data.rows[0];
                                let fecha = moment(result.REGISTRADO_EN).add(lastHours, 'hour');
                                if (fecha < moment()) {
                                    reject({
                                        status: "ERROR",
                                        data: {
                                            terminal: terminal,
                                            lastInsert: result.REGISTRADO_EN
                                        }
                                    });
                                } else {
                                    resolve({
                                        status: "OK",
                                        data: {
                                            terminal: terminal,
                                            lastInsert: result.REGISTRADO_EN
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    getRatesByPeriod (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool,
                strWhere = ' AND ',
                moment = require("moment"),
                fecha_emision,
                Enumerable = require("linq");

            if (params.fechaInicio) {
                strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }
            if (params.fechaFin) {
                strWhere += ` FECHA_EMISION < TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }
            if (strWhere.length > 0) {
                strWhere = strWhere.substr(0, strWhere.length - 4);
            }

            if (pool) {
                var strSql;
                if (params.period === 'date') {
                    fecha_emision = `TO_CHAR(FECHA_EMISION, 'YYYY-MM-DD')`;
                } else if (params.period === 'month') {
                    fecha_emision = `TO_CHAR(FECHA_EMISION, 'YYYY-MM')`;
                } else {
                    fecha_emision = `TO_CHAR(FECHA_EMISION, 'YYYY')`;
                }

                if (params.tasaAgp === '1') {
                    strSql = `SELECT ${fecha_emision} FECHA_EMISION, T.CODE, DESCRIPCION,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE) TASA,
                                  SUM(PRECIO*CNT*V.TYPE) TASA_AGP,
                                  SUM(VHD.CNT) CNT ,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE*VHD.COTI_MONEDA) TOTAL_TASA,
                                  SUM(PRECIO*CNT*V.TYPE*VHD.COTI_MONEDA) TOTAL_TASA_AGP,
                                  COUNT(DISTINCT CONTENEDOR) AS CONTENEDORES
                            FROM V_INVOICE_HEADER_DETAIL VHD
                              INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                              INNER JOIN TARIFARIO_TERMINAL TT ON TT.CODE = VHD.CODE AND TT.TERMINAL = VHD.TERMINAL
                              INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID,
                              TARIFARIO_PRECIO TP

                            WHERE TP.TARIFARIO_ID = T.ID AND
                                  TP.ID = (SELECT MAX(ID) FROM TARIFARIO_PRECIO TP1 WHERE FECHA <= FECHA_EMISION AND TP.TARIFARIO_ID = TP1.TARIFARIO_ID ) AND
                                  RATE IS NOT NULL ${strWhere}
                            GROUP BY ${fecha_emision}, T.CODE, DESCRIPCION
                            ORDER BY FECHA_EMISION`;
                } else {

                    strSql = `SELECT ${fecha_emision} FECHA_EMISION, T.CODE, DESCRIPCION,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE) TASA,
                                  SUM(VHD.CNT) CNT ,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE*VH.COTI_MONEDA) TOTAL_TASA,
                                  COUNT(DISTINCT CONTENEDOR) AS CONTENEDORES
                            FROM INVOICE_HEADER VH
                              inner join INVOICE_DETAIL VHD ON VHD.INVOICE_HEADER_ID = VH.ID
                              INNER JOIN VOUCHER_TYPE V ON V.ID = VH.COD_TIPO_COMPROB
                              INNER JOIN TARIFARIO_TERMINAL TT ON TT.CODE = VHD.CODE AND TT.TERMINAL = VH.TERMINAL
                              INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                            WHERE RATE IS NOT NULL ${strWhere}
                            GROUP BY ${fecha_emision}, T.CODE,DESCRIPCION
                            ORDER BY FECHA_EMISION`;
                }
                pool.getConnection ((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getRatesDate", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        connection.execute(strSql, [],{}, (err, data) => {
                            if (err) {
                                console.log("%s, Error en Oracle getRatesDate", new Date());
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                if (data.rows) {
                                    let prop;
                                    let grouped = Enumerable.from(data.rows)
                                        .groupBy('$.FECHA_EMISION', "", (key, g) => {
                                            prop = g.getSource();
                                            return {
                                                date: key,
                                                codes: prop.map(item => ({
                                                    code: item.CODE,
                                                    //rate: right.rate,
                                                    descripcion: item.DESCRIPCION,
                                                    terminal: item.TERMINAL,
                                                    ton: item.CNT,
                                                    total: item.TASA,
                                                    totalPeso: item.TOTAL_TASA,
                                                    totalAgp: item.TASA_AGP,
                                                    totalPesoAgp: item.TOTAL_TASA_AGP,
                                                    contenedores: item.CONTENEDORES
                                                }
                                                ))
                                            };
                                        })
                                        .toArray();
                                    resolve({
                                        status: "OK",
                                        data: grouped
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    getRatesByTerminal (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool,
                strWhere = ' AND ',
                strWhereExists = '',
                moment = require("moment"),
                fecha_emision,
                Enumerable = require("linq");

            if (params.fechaInicio) {
                strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }
            if (params.fechaFin) {
                strWhere += ` FECHA_EMISION < TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }

            if (params.nroPtoVenta) {
                strWhere += ` NRO_PTO_VENTA = ${params.nroPtoVenta} AND `;
            }
            if (params.codTipoComprob) {
                strWhere += ` COD_TIPO_COMPROB = ${params.codTipoComprob} AND `;
            }
            if (params.nroComprobante) {
                strWhere += ` NRO_COMPROB = ${params.nroComprobante} AND `;
            }
            if (params.razonSocial) {
                strWhere += ` RAZON = '${params.razonSocial}' AND `;
            }
            if (params.documentoCliente) {
                strWhere += ` NRO_DOC = ${params.documentoCliente} AND `;
            }
            if (params.estado) {
                strWhere += ` STATE IN (${params.estado.split(',').map(state => (`'${state}'`))}) AND `;
            }
            if (params.resend) {
                strWhere += ` RESEND = ${params.resend} AND `;
            }
            //DETAIL
            if (params.contenedor) {
                strWhereExists += ` CONTENEDOR = '${params.contenedor}' AND `;
            }
            if (params.iso3Forma) {
                strWhereExists += ` FORMA = '${params.iso3Forma}' AND `;
            }
            if (params.buqueNombre) {
                strWhereExists += ` BUQUE_NOMBRE = '${params.buqueNombre}' AND `;
            }
            if (params.viaje) {
                strWhereExists += ` BUQUE_VIAJE = '${params.viaje}' AND `;
            }
            if (params.code) {
                strWhereExists += ` CODE = '${params.code}' AND `;
            }

            if (strWhereExists.length > 0) {
                strWhereExists = ` ( SELECT * FROM INVOICE_DETAIL I LEFT JOIN ISO3 ON SUBSTR(I.ISO, 3,1) = ISO3.ID WHERE VH.ID = INVOICE_HEADER_ID AND ${strWhereExists.substr(0, strWhereExists.length - 4)} ) `;
                strWhere += ` EXISTS ${strWhereExists} AND `;
            }

            if (strWhere.length > 0) {
                strWhere = strWhere.substr(0, strWhere.length - 4);
            }

            if (pool) {
                var strSql;
                if (params.period === 'year') {
                    fecha_emision = `TO_CHAR(FECHA_EMISION, 'YYYY')`;
                } else if (params.period === 'month') {
                    fecha_emision = `TO_CHAR(FECHA_EMISION, 'YYYY-MM')`;
                } else {
                    fecha_emision = `TO_CHAR(FECHA_EMISION, 'YYYY-MM-DD')`;
                }

                if (params.tasaAgp === '1') {
                    strSql = `SELECT VH.TERMINAL, ${fecha_emision} FECHA_EMISION, T.CODE, DESCRIPCION,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE) TASA,
                                  SUM(PRECIO*CNT*V.TYPE) TASA_AGP,
                                  SUM(VHD.CNT*V.TYPE) CNT ,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE*VHD.COTI_MONEDA) TOTAL_TASA,
                                  SUM(PRECIO*CNT*V.TYPE*VHD.COTI_MONEDA) TOTAL_TASA_AGP,
                                  COUNT(DISTINCT CONTENEDOR) CONTENEDORES
                            FROM V_INVOICE_HEADER_DETAIL VH
                              INNER JOIN VOUCHER_TYPE V ON V.ID = VH.COD_TIPO_COMPROB
                              INNER JOIN TARIFARIO_TERMINAL TT ON TT.CODE = VH.CODE AND TT.TERMINAL = VH.TERMINAL
                              INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID,
                              TARIFARIO_PRECIO TP

                            WHERE TP.TARIFARIO_ID = T.ID AND
                                  TP.ID = (SELECT MAX(ID) FROM TARIFARIO_PRECIO TP1 WHERE FECHA <= FECHA_EMISION AND TP.TARIFARIO_ID = TP1.TARIFARIO_ID ) AND
                                  RATE IS NOT NULL ${strWhere}
                            GROUP BY VH.TERMINAL, ${fecha_emision}, T.CODE, DESCRIPCION
                            ORDER BY FECHA_EMISION`;
                } else {

                    strSql = `SELECT VH.TERMINAL, ${fecha_emision} FECHA_EMISION, T.CODE, DESCRIPCION,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE) TASA,
                                  SUM(VHD.CNT*V.TYPE) CNT,
                                  SUM(VHD.IMP_UNIT*CNT*V.TYPE*VH.COTI_MONEDA) TOTAL_TASA,
                                  COUNT(DISTINCT CONTENEDOR) CONTENEDORES
                            FROM INVOICE_HEADER VH
                              inner join INVOICE_DETAIL VHD ON VHD.INVOICE_HEADER_ID = VH.ID
                              INNER JOIN VOUCHER_TYPE V ON V.ID = VH.COD_TIPO_COMPROB
                              INNER JOIN TARIFARIO_TERMINAL TT ON TT.CODE = VHD.CODE AND TT.TERMINAL = VH.TERMINAL
                              INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                            WHERE RATE IS NOT NULL ${strWhere}
                            GROUP BY VH.TERMINAL, ${fecha_emision}, T.CODE, DESCRIPCION
                            ORDER BY FECHA_EMISION`;
                }
                console.log(strSql);
                pool.getConnection ((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getRatesDate", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        connection.execute(strSql, [],{}, (err, data) => {
                            if (err) {
                                console.log("%s, Error en Oracle getRatesDate", new Date());
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                if (data.rows) {
                                    let prop;
                                    let grouped = Enumerable.from(data.rows)
                                        .groupBy('$.FECHA_EMISION', "", (key, g) => {
                                            prop = g.getSource();
                                            return {
                                                date: key,
                                                codes: prop.map(item => ({
                                                    code: item.CODE,
                                                    //rate: right.rate,
                                                    descripcion: item.DESCRIPCION,
                                                    terminal: item.TERMINAL,
                                                    ton: item.CNT,
                                                    total: item.TASA,
                                                    totalPeso: item.TOTAL_TASA,
                                                    totalAgp: item.TASA_AGP,
                                                    totalPesoAgp: item.TOTAL_TASA_AGP,
                                                    contenedores: item.CONTENEDORES
                                                }
                                                ))
                                            };
                                        })
                                        .toArray();
                                    resolve({
                                        status: "OK",
                                        data: grouped
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    getRatesByContainer (params) {
        return new Promise((resolve, reject) => {
            var Enumerable = require('linq');
            var pool = this.cn.pool;

            if (pool) {
                var strSql;

                strSql = `SELECT VHD.TERMINAL, T.CODE, DESCRIPCION, SUM(CNT) CANTIDAD,  SUM(VHD.IMP_UNIT*CNT*V.TYPE) TASA
                            FROM V_INVOICE_HEADER_DETAIL VHD
                                INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                                INNER JOIN TARIFARIO_TERMINAL TT ON TT.CODE = VHD.CODE AND TT.TERMINAL = VHD.TERMINAL
                                INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID,
                                            TARIFARIO_PRECIO TP
                            WHERE TP.TARIFARIO_ID = T.ID AND
                                TP.ID = (SELECT MAX(ID) FROM TARIFARIO_PRECIO TP1 WHERE FECHA <= FECHA_EMISION AND TP.TARIFARIO_ID = TP1.TARIFARIO_ID ) AND
                                RATE IS NOT NULL and vhd.TERMINAL = :1 AND
                                VHD.CONTENEDOR = :2
                            GROUP BY VHD.TERMINAL, T.CODE, DESCRIPCION`;
                pool.getConnection ((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getRatesDate", new Date());
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        connection.execute(strSql, [params.terminal, params.contenedor],{}, (err, data) => {
                            if (err) {
                                console.log("%s, Error en Oracle getRatesDate", new Date());
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                this.cn.doRelease(connection);
                                if (data.rows) {
                                    resolve({
                                        status: "OK",
                                        total: Enumerable.from(data.rows).sum('$.TASA'),
                                        data: data.rows.map(item => ({
                                            code: item.CODE,
                                            description: item.DESCRIPCION,
                                            terminal: item.TERMINAL,
                                            cnt: item.CANTIDAD,
                                            total: item.TASA
                                        }))
                                    });
                                }
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getNoRates (params, callback) {

        callback({
            status: "ERROR",
            message: "NOT IMPLEMENTED"
        });

    }

    getNoMatches (params) {
        return new Promise((resolve, reject) => {
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
                            if (orderBy.includes('NROPTOVENTA')) {
                                orderBy = 'NRO_PTO_VENTA';
                            }
                            else if (orderBy.includes('CODTIPOCOMPROB')) {
                                orderBy = 'COD_TIPO_COMPROB';
                            }
                            else if (orderBy.includes('RAZON')) {
                                orderBy = 'RAZON';
                            }
                            else if (orderBy.includes('NROCOMPROB')) {
                                orderBy = 'NRO_COMPROB';
                            }
                            else if (orderBy.includes('FECHA.EMISION')) {
                                orderBy = 'FECHA_EMISION';
                            }
                            else if (orderBy.includes('IMPORTE.TOTAL')) {
                                orderBy = 'TOTAL';
                            }
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
                                                COTI_MONEDA,
                                                COD_MONEDA,
                                                USR,
                                                GRUPO,
                                                STATE,
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
                                            coti_moneda: item.COTI_MONEDA,
                                            codMoneda: item.COD_MONEDA,
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
            }  else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
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
                    if (callback) { return callback(err); }
                } else {
                    strSql =`
                                SELECT DISTINCT IH2.CONTENEDOR
                                FROM V_INVOICE_HEADER_DETAIL IH2
                                WHERE IH2.COD_TIPO_COMPROB = 1 AND
                                    IH2.CONTENEDOR IS NOT NULL AND
                                    IH2.TERMINAL = :1 AND
                                NOT EXISTS (SELECT *
                                            FROM V_INVOICE_HEADER_DETAIL IH1,
                                                TARIFARIO_TERMINAL TT
                                            WHERE TT.TERMINAL = IH1.TERMINAL AND
                                                  IH1.CODE = TT.CODE AND
                                                  IH1.TERMINAL = IH2.TERMINAL AND
                                                  IH1.COD_TIPO_COMPROB = IH2.COD_TIPO_COMPROB AND
                                                  IH2.CONTENEDOR = IH1.CONTENEDOR AND
                                                  TARIFARIO_ID IN (
                                                                  SELECT ID
                                                                  FROM TARIFARIO
                                                                  WHERE TERMINAL = 'AGP' AND
                                                                        RATE is not null) ) %s`;

                    if (params.fechaInicio) {
                        strWhere += util.format(" IH2.FECHA_EMISION >= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                    }
                    if (params.fechaFin) {
                        strWhere += util.format(" IH2.FECHA_EMISION <= TO_DATE('%s', 'RRRR-MM-DD') AND ", moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD'));
                    }

                    if (params.buqueNombre) {
                        strWhere += util.format(" IH2.BUQUE_NOMBRE = '%s' AND ", params.buqueNombre);
                    }

                    if (params.viaje) {
                        strWhere += util.format(" IH2.BUQUE_VIAJE = '%s' AND ", params.viaje);
                    }

                    if (strWhere.length > 0) {
                        strWhere = util.format(" AND %s ", strWhere.substr(0, strWhere.length - 4));
                    }

                    strSql = util.format(strSql, strWhere);

                    connection.execute(strSql, [params.terminal], {resultSet: true}, (err, data) => {
                        let result;
                        if (err) {
                            if (callback) {return callback({status: "ERROR", message: err.message, data: err}); }
                        } else {
                            let rSet = data.resultSet;
                            getResultSet(connection, rSet, 1000)
                                .then(data => {
                                    rSet.close(err => {
                                        self.cn.doRelease(connection);
                                    });
                                    data = data.map(item => {
                                        return item.CONTENEDOR;
                                    });
                                    result = {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data
                                    };
                                    if (callback) { return callback(undefined, result); }
                                })
                                .catch(err => {
                                    self.cn.doRelease(connection);
                                    console.error(err);
                                });
                        }
                    });
                }
            });
        } else {
            callback({
                status: "ERROR",
                message: "Error en el Servidor de Base de Datos"
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
                    if (callback) { return callback(err); }
                } else {
                    strSql = `SELECT DISTINCT BUQUE_NOMBRE
                            FROM INVOICE_DETAIL IND
                                INNER JOIN INVOICE_HEADER INH ON IND.INVOICE_HEADER_ID = INH.ID
                            WHERE TERMINAL = :1
                            ORDER BY BUQUE_NOMBRE`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY, resultSet: true}, (err, data) => {
                        if (err) {
                            if (callback) { return callback({status: "ERROR", message: err.message, data: err}); }
                        } else {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {
                                    resultSet.close(err=> {
                                        this.cn.doRelease(connection);
                                    });
                                    if (callback) { return callback(undefined, {
                                        status: "OK",
                                        totalCount: data.length,
                                        data: data.map(item => {return item[0];})
                                    }); }
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
        } else {
            callback({
                status: "ERROR",
                message: "Error en el Servidor de Base de Datos"
            });
        }
    }

    getShipContainers (params) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err});
                    } else {
                        var strSql = `SELECT VHD.CONTENEDOR, SUM(CNT*VOUCHER_TYPE.TYPE) AS TONELADAS, COUNT(G.CONTENEDOR) AS GATES_CNT
                            FROM V_INVOICE_HEADER_DETAIL VHD
                                INNER JOIN VOUCHER_TYPE ON COD_TIPO_COMPROB = VOUCHER_TYPE.ID
                                INNER JOIN TARIFARIO_TERMINAL TT ON VHD.CODE = TT.CODE AND VHD.TERMINAL = TT.TERMINAL
                                INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID AND RATE IS NOT NULL
                                LEFT JOIN GATES G ON G.CONTENEDOR = VHD.CONTENEDOR AND VHD.BUQUE_NOMBRE = G.BUQUE AND VHD.BUQUE_VIAJE = G.VIAJE AND VHD.TERMINAL = G.TERMINAL
                            WHERE VHD.TERMINAL = :1 AND
                                  BUQUE_NOMBRE = :2 AND
                                  BUQUE_VIAJE = :3
                            GROUP BY VHD.CONTENEDOR
                            ORDER BY VHD.CONTENEDOR`;
                        connection.execute(strSql, [params.terminal, params.buque, params.viaje], {resultSet: true}, (err, data) => {
                            if (err) {
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err});
                            } else {
                                let resultSet = data.resultSet;
                                getResultSet(connection, data.resultSet, 500)
                                    .then(data => {
                                        resultSet.close(err=> {
                                            this.cn.doRelease(connection);
                                        });
                                        resolve({
                                            status: "OK",
                                            totalCount: data.length,
                                            data: data.map(item => (({
                                                contenedor: item.CONTENEDOR,
                                                toneladas: item.TONELADAS,
                                                gatesCnt: (item.GATES_CNT === 0) ? undefined : item.GATES_CNT
                                            })))
                                        });
                                    })
                                    .catch(err => {
                                        console.info(err);
                                        this.cn.doRelease(connection);
                                        reject({status: "ERROR", message: err.message, data: err});
                                    });
                            }
                        });
                    }});
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getShipTrips (params) {
        return new Promise((resolve, reject) => {

            var self = this;
            var strSql;
            var pool = self.cn.pool;
            var moment = require("moment");
            var Enumerable = require('linq');

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        self.cn.doRelease(connection);
                        reject({status: "ERROR", message: err.message, data: err});
                    } else {
                        strSql = `SELECT BUQUE_NOMBRE, BUQUE_VIAJE, BUQUE_FECHA
                                    FROM INVOICE_DETAIL IND
                                        INNER JOIN INVOICE_HEADER INH ON IND.INVOICE_HEADER_ID = INH.ID
                                    WHERE TERMINAL = :1
                                    GROUP BY BUQUE_NOMBRE, BUQUE_VIAJE, BUQUE_FECHA
                                    ORDER BY BUQUE_NOMBRE`;
                        connection.execute(strSql, [params.terminal], {resultSet: true}, (err, data) => {
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                let resultSet = data.resultSet;
                                getResultSet(connection, data.resultSet, 500)
                                    .then(data => {
                                        resultSet.close( err => {
                                            this.cn.doRelease(connection);
                                        });

                                        var prop,
                                            ter;
                                        var resultTer = Enumerable
                                            .from(data)
                                            .select(item => {
                                                return {
                                                    buque: item.BUQUE_NOMBRE,
                                                    viaje: item.BUQUE_VIAJE,
                                                    fecha: item.BUQUE_FECHA
                                                };
                                            })
                                            .groupBy("$.buque" , null, (key, g) => {
                                                prop = g.getSource();
                                                ter = {
                                                    buque: key,
                                                    viajes: prop.map(item => (
                                                        [item.viaje, (item.fecha ? moment(item.fecha).format("DD-MM-YYYY") : "")]
                                                    )),
                                                    both: false
                                                };
                                                return (ter);
                                            }).toArray();


                                        resolve({
                                            status: "OK",
                                            totalCount: resultTer.length,
                                            data: resultTer
                                        });
                                    })
                                    .catch(err => {
                                        console.info(err);
                                        this.cn.doRelease(connection);
                                        reject({status: "ERROR", message: err.message, data: err});
                                    });
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }

        });
    }

    getTotales (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var pool = this.cn.pool;
            var strSql = '',
                strWhere = '',
                strWhereExists = '';

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: err.message, data: err});
                    } else {

                        if (params.terminal) {
                            strWhere += ` HD.TERMINAL = '${params.terminal}' AND `;
                        }
                        if (params.fechaInicio) {
                            strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `
                        }
                        if (params.fechaFin) {
                            strWhere += ` FECHA_EMISION <= TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                        }
                        if (params.nroPtoVenta) {
                            strWhere += ` NRO_PTO_VENTA = ${params.nroPtoVenta} AND `;
                        }
                        if (params.codTipoComprob) {
                            strWhere += ` COD_TIPO_COMPROB = ${params.codTipoComprob} AND `;
                        }
                        if (params.nroComprobante) {
                            strWhere += ` NRO_COMPROB = ${params.nroComprobante} AND `;
                        }
                        if (params.razonSocial) {
                            strWhere += ` RAZON = '${params.razonSocial}' AND `;
                        }
                        if (params.documentoCliente) {
                            strWhere += ` NRO_DOC = ${params.documentoCliente} AND `;
                        }
                        if (params.estado) {
                            strWhere += ` STATE IN (${params.estado.split(',').map(state => "'" + state + "'")} AND `;
                        }
                        if (params.resend) {
                            strWhere += ` RESEND = ${params.resend} AND `;
                        }

                        //DETAIL FILTERS
                        if (params.contenedor) {
                            strWhereExists += ` CONTENEDOR = '${params.contenedor}' AND `;
                        }
                        if (params.iso3Forma) {
                            strWhereExists += ` FORMA = '${params.iso3Forma}' AND `;
                        }
                        if (params.buqueNombre) {
                            strWhereExists += ` BUQUE_NOMBRE = '${params.buqueNombre}' AND `;
                        }
                        if (params.viaje) {
                            strWhereExists += ` BUQUE_VIAJE = '${params.viaje}' AND `;
                        }
                        if (params.code) {
                            strWhereExists += ` CODE = '${params.code}' AND `;
                        }

                        if (strWhereExists.length > 0) {
                            strWhereExists = `( SELECT * FROM INVOICE_DETAIL I LEFT JOIN ISO3 ON SUBSTR(I.ISO, 3,1) = ISO3.ID WHERE HD.ID = INVOICE_HEADER_ID AND ${strWhereExists.substr(0, strWhereExists.length - 4)} )`;
                            strWhere += ` EXISTS ${strWhereExists} AND `;
                        }

                        if (strWhere.length > 0) {
                            strWhere = ` WHERE COD_MONEDA = 'DOL' AND ${strWhere.substr(0, strWhere.length - 4)} `;
                        }

                        strSql = `SELECT TERMINAL, SUM(IMPORTE_TOTAL * V.TYPE) AS TOTAL, MAX(IMPORTE_TOTAL * V.TYPE) AS MAXI, MIN(IMPORTE_TOTAL * V.TYPE) AS MINI, AVG(IMPORTE_TOTAL * V.TYPE) AS PROM, SUM(CONTES) AS CONTES
                                    FROM INVOICE_HEADER HD
                                     INNER JOIN VOUCHER_TYPE V ON HD.COD_TIPO_COMPROB = V.ID
                                     INNER JOIN (SELECT INVOICE_HEADER_ID, COUNT(DISTINCT CONTENEDOR) CONTES FROM INVOICE_DETAIL GROUP BY INVOICE_HEADER_ID) CONTE
                                                        ON CONTE.INVOICE_HEADER_ID = HD.ID
                                     ${strWhere}
                                    GROUP BY TERMINAL`;

                        connection.execute(strSql, [], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                resolve({
                                    status: "OK",
                                    data: data.rows.map(item => ({
                                        terminal: item.TERMINAL,
                                        total: item.TOTAL,
                                        max: item.MAXI,
                                        min: item.MINI,
                                        avg: item.PROM,
                                        contes: item.CONTES
                                    }))
                                });
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }

        });
    }

    getTotal (params, callback) {
        callback();
    }

    getTotalByClient (params, options) {
        return new Promise ((resolve, reject) => {

            var pool = this.cn.pool,
                strSql,
                strWhere = '',
                strWhereTop = '',
                strOrder = ' DESC ',
                strCampo = ' TOTAL ',
                clientArr = [],
                moment = require('moment'),
                Enumerable = require('linq');

            if (params.fechaInicio) {
                strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }
            if (params.fechaFin) {
                strWhere += ` FECHA_EMISION <= TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }

            if (params.clients) {
                let clientes = '';
                if (typeof clients === 'string') {
                    clientArr.push(params.clients);
                } else {
                    clientArr = params.clients;
                }
                clientArr.forEach(item => {
                    clientes += `'${item}',`;
                });
                clientes = clientes.substr(0, clientes.length-1);
                strWhere += ` RAZON IN (${clientes}) AND `;

            }
            if (strWhere.length > 0) {
                strWhere = ` AND ${strWhere.substr(0, strWhere.length - 4)} `;
            }

            if (params.order === 1) {
                strOrder =  ` ASC `;
            }
            if (params.campo === 'total') {
                strCampo =  ` SUM(TOTAL) `;
            } else if (params.campo === 'avg') {
                strCampo =  ` AVG(TOTAL) `;
            } else if (params.campo === 'max') {
                strCampo =  ` MAX(TOTAL) `;
            } else if (params.campo === 'min') {
                strCampo =  ` MIN(TOTAL) `;
            }

            if (params.top) {
                strWhereTop =  ` WHERE R <= ${params.top} `;
            }
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: err.message, data: err});
                    } else {
                        strSql = `SELECT *
                            FROM (
                                SELECT NRO_DOC CUIT, RAZON, SUM(TOTAL) TOTAL, COUNT(*) CNT, MIN(TOTAL) MINI, MAX(TOTAL) MAXI, AVG(TOTAL) AVERG,
                                      ROW_NUMBER() OVER (ORDER BY ${strCampo} ${strOrder} ) R
                                FROM INVOICE_HEADER VHD
                                    INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                                WHERE v.type = 1 AND TERMINAL = :1 ${strWhere}
                                GROUP BY NRO_DOC, RAZON
                              )
                            ${strWhereTop}`;

                        connection.execute(strSql, [params.terminal], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {

                                if (options.output === 'csv') {
                                    let response = "CUIT|RAZON|COMP|MINIMA|PROMEDIO|MAXIMA|TOTAL\n";

                                    data.forEach((item) => {
                                        response = response +
                                            item.CUIT +
                                            "|" +
                                            item.RAZON +
                                            "|" +
                                            item.CNT +
                                            "|" +
                                            item.MIN +
                                            "|" +
                                            item.AVERG +
                                            "|" +
                                            item.MAXI +
                                            "|" +
                                            item.TOTAL +
                                            "\n";
                                    });
                                    resolve({
                                        status: "OK",
                                        data: response
                                    });
                                } else {
                                    let dataResult = data.rows.map(item => ({
                                        cuit: item.CUIT,
                                        razon: item.RAZON,
                                        terminal: item.TERMINAL,
                                        min: item.MINI,
                                        avg: item.AVERG,
                                        max: item.MAXI,
                                        total: item.TOTAL,
                                        cnt: item.CNT
                                    }));
                                    resolve({
                                        status: "OK",
                                        total: Enumerable.from(dataResult).sum('$.total'),
                                        data: dataResult
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Retorna el importe facturado por contenedor por terminal ordernado por el total
     * Administrar - Reportes - Facturacion Contenedores
     * */
    getTotalByContainer (params, options = {}) {
        return new Promise ((resolve, reject) => {

            var pool = this.cn.pool,
                strSql,
                strWhere = '',
                strWhereTop = '',
                strOrder = ' DESC ',
                strCampo = ' SUM(IMP_TOT * v.type) ',
                moment = require('moment'),
                tasks = [],
                async = require("async");
            let Enumerable = require("linq");

            params.top = params.top || 100;

            if (params.fechaInicio) {
                strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }
            if (params.fechaFin) {
                strWhere += ` FECHA_EMISION <= TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
            }

            if (strWhere.length > 0) {
                strWhere = ` AND ${strWhere.substr(0, strWhere.length - 4)} `;
            }

            if (params.order === 1) {
                strOrder =  ` ASC `;
            }
            if (params.campo === 'total') {
                strCampo =  ` SUM(IMP_TOT * v.type) `;
            }

            if (params.top) {
                strWhereTop =  ` WHERE R <= ${params.top} `;
            }
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: err.message, data: err});
                    } else {

                        strSql = `SELECT ID FROM ISO1`;
                        connection.execute(strSql, [], {}, (err, isos) => {

                            if (isos.rows.length > 0) {
                                ["IMPO", "EXPO", "REMOVIDO"].forEach(tipoMov => {
                                    isos.rows.forEach( item => {
                                        tasks.push(asyncCallback => {

                                            strSql = `SELECT *
                                            FROM (
                                                  SELECT VHD.TERMINAL, CONTENEDOR, BUQUE_NOMBRE, BUQUE_VIAJE, ISO1, SUM(IMP_TOT*v.type) TOTAL_CON, ROW_NUMBER() OVER (ORDER BY  ${strCampo} ${strOrder}  ) R
                                                  FROM V_INVOICE_HEADER_DETAIL VHD
                                                          INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                                                  WHERE TIPO = :1 AND
                                                        ISO1 = '${item.ID}' ${strWhere}
                                                  GROUP BY VHD.TERMINAL, CONTENEDOR, BUQUE_NOMBRE, BUQUE_VIAJE, ISO1
                                            )
                                            ${strWhereTop}`;

                                            //( (vhd.terminal = 'BACTSSA' AND NRO_COMPROB in (42618, 61977) and nro_pto_venta in (25, 29) )
                                            //or
                                            //(vhd.terminal = 'TRP' AND NRO_COMPROB in (41952) and nro_pto_venta in (55) )
                                            //) and
                                            //LENGTH(CONTENEDOR) = 11 AND


                                            connection.execute(strSql, [tipoMov], {}, (err, data) => {
                                                if (err) {
                                                    asyncCallback(err);
                                                } else {
                                                    if (options.output === 'csv') {
                                                        let response = "TERMINAL|CONTENEDOR|BUQUE|VIAJE|TOTAL|ISO1\n";

                                                        data.forEach((item) => {
                                                            response = response +
                                                                item.TERMINAL +
                                                                "|" +
                                                                item.CONTENEDOR +
                                                                "|" +
                                                                item.BUQUE_NOMBRE +
                                                                "|" +
                                                                item.BUQUE_VIAJE +
                                                                "|" +
                                                                item.TOTAL +
                                                                "|" +
                                                                item.ISO1 +
                                                                "\n";
                                                        });
                                                        resolve({
                                                            status: "OK",
                                                            data: response
                                                        });
                                                    } else {
                                                        if (data.rows.length > 0) {
                                                            let dataResult = Enumerable
                                                                .from(data.rows)
                                                                .select(x => ({
                                                                    mov: tipoMov,
                                                                    terminal: x.TERMINAL,
                                                                    contenedor: x.CONTENEDOR,
                                                                    buque: x.BUQUE_NOMBRE,
                                                                    viaje: x.BUQUE_VIAJE,
                                                                    total: x.TOTAL_CON,
                                                                    iso1: x.ISO1
                                                                })).toArray();
                                                            //.groupBy('$.mov',
                                                            //function (item) {
                                                            //    return item;
                                                            //},
                                                            //function (tipoMov, grouping) {
                                                            //    var grupo = grouping.getSource(),
                                                            //        grupoItem = {
                                                            //            mov: tipoMov,
                                                            //            data: grupo
                                                            //        };
                                                            //
                                                            //    return grupoItem;
                                                            //}).toArray();

                                                            asyncCallback(null, {
                                                                iso: item.ID,
                                                                data: dataResult
                                                            });
                                                        } else {
                                                            asyncCallback(null, {
                                                                data: []
                                                            });
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                });

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
                                            status: "OK",
                                            data: data.filter(item => {return item.data.length>0;})
                                        });
                                    }
                                });
                            } else {
                                //this.cn.doRelease(connection);
                                resolve({
                                    status: "OK",
                                    data: null
                                });
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    getInvoicesByRatesTerminal (params, options) {
        return new Promise((resolve, reject) => {
            var strSql,
                response,
                andWhere = ' AND ';

            var pool = this.cn.pool;

            if (params.fechaInicio && params.fechaFin) {
                andWhere += ` FECHA_EMISION >= TO_DATE('${params.fechaInicio}', 'YYYY-MM-DD') AND `;
                andWhere += ` FECHA_EMISION <= TO_DATE('${params.fechaFin}', 'YYYY-MM-DD') AND `;
            } else {
                if (params.year) {
                    andWhere += ` TO_CHAR(FECHA_EMISION, 'YYYY') = ${params.year} AND `;
                }
                if (params.month) {
                    andWhere += ` TO_CHAR(FECHA_EMISION, 'MM') = ${params.month} AND `;
                }
            }

            andWhere = andWhere.substr(0, andWhere.length - 4);
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: err.message, data: err});
                    } else {
                        strSql = `SELECT ${(options.tarifa==='agp')?'T':'VHD'}.CODE,
                                        SUM(CASE COD_MONEDA
                                          WHEN 'PES' THEN IMP_TOT * V.TYPE
                                          ELSE IMP_TOT * COTI_MONEDA * V.TYPE
                                        END) TOTAL,
                                        T.DESCRIPCION
                                FROM V_INVOICE_HEADER_DETAIL VHD
                                    INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                                    LEFT JOIN TARIFARIO_TERMINAL TT ON TT.CODE = VHD.CODE AND TT.TERMINAL = VHD.TERMINAL
                                    LEFT JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                                WHERE VHD.TERMINAL = :1
                                ${andWhere}
                                GROUP BY ${(options.tarifa==='agp')?'T':'VHD'}.CODE, T.DESCRIPCION
                                ORDER BY TOTAL DESC`;
                        connection.execute(strSql, [params.terminal], {resultSet: true}, (err, data) => {
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                let resultSet = data.resultSet;
                                getResultSet(connection, data.resultSet, 500)
                                    .then(data => {
                                        resultSet.close( err => {
                                            this.cn.doRelease(connection);
                                        });

                                        if (options.output === 'csv') {
                                            response = "TARIFA|DESCRIPCION|TOTAL\n";

                                            data.forEach(item => {
                                                response += `${item.CODE} | ${(item.DESCRIPCION === null) ? "Tarifa no asociada" : item.DESCRIPCION} | ${item.TOTAL}\n`;
                                            });
                                            resolve({
                                                status: "OK",
                                                data: response
                                            });
                                        } else {
                                            resolve({
                                                status: "OK",
                                                totalCount: data.length,
                                                data: data.map(item => ({
                                                    code: item.CODE,
                                                    description: (item.DESCRIPCION === null) ? "Tarifa no asociada" : item.DESCRIPCION,
                                                    total: item.TOTAL
                                                }))
                                            });
                                        }
                                    })
                                    .catch(err => {
                                        console.info(err);
                                        this.cn.doRelease(connection);
                                        reject({status: "ERROR", message: err.message, data: err});
                                    });
                            }
                        });

                    }
                });
            }
        });
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

    getByCode (code, terminal) {
        return new Promise((resolve, reject) => {
            var strSql;
            var Enumerable = require("linq");
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({
                            status: 'ERROR',
                            message: err.message,
                            data: err
                        });
                    } else {
                        strSql = `SELECT IMP_UNIT, MAX(FECHA_EMISION) FECHA_EMISION, COUNT(*) CANTIDAD
                                    FROM V_INVOICE_HEADER_DETAIL
                                    WHERE CODE = :1 AND
                                          TERMINAL = :2
                                    GROUP BY IMP_UNIT`;
                        connection.execute(strSql, [code, terminal], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                var result = Enumerable.from(data.rows)
                                    .orderByDescending('$.FECHA_EMISION')
                                    .select(item => ({
                                        fecha: item.FECHA_EMISION,
                                        imp_unit: item.IMP_UNIT,
                                        cnt: item.CANTIDAD
                                    }))
                                    .toArray();
                                if (data.rows.length > 0) {
                                    resolve({
                                        status: "OK",
                                        data: result});
                                } else {
                                    resolve({
                                        status: "OK",
                                        data: {}
                                    });
                                }
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
                });
            }
        });
    }

    /**
     * Retorna todos los comprobantes en donde existe el Contenedor con el Total
     * del Contenedor discriminado
     * Administrar - Contenedores - Ver
     * */
    getByContainer (params) {
        return new Promise((resolve, reject) => {
            var strSql,
                strWhere = ' ';
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        reject({
                            status: 'ERROR',
                            message: err.message,
                            data: err
                        });
                    } else {

                        if (params.buque) {
                            strWhere += ` BUQUE_NOMBRE = '${params.buque}' AND `;
                        }
                        if (params.viaje) {
                            strWhere += ` BUQUE_VIAJE = '${params.viaje}' AND `;
                        }
                        strSql = `SELECT IH.TERMINAL, IH.TIPO, FECHA_EMISION, IH.ID, COD_TIPO_COMPROB, CONTES, NRO_COMPROB, COTI_MONEDA, COD_MONEDA, NRO_PTO_VENTA, RAZON,
                                        STA.STATE, STA.GRUPO, STA.USR,
                                        IH.PAYMENT_ID, PAYMENT_PRE_NUMBER, PAYMENT_NUMBER,
                                        BUQUE_NOMBRE, BUQUE_VIAJE, TOTAL, IMPORTE_TOTAL, TOTAL_CON, (TOTAL_CON * COTI_MONEDA) TOTAL_CON_PES, CONTENEDOR, ISO
                                    FROM INVOICE_HEADER IH
                                        INNER JOIN INVOICE_STATE STA ON  IH.ID = STA.INVOICE_HEADER_ID AND
                                                                        STA.ID = (SELECT MAX(ST1.ID) FROM INVOICE_STATE ST1 WHERE ST1.INVOICE_HEADER_ID = IH.ID)
                                        INNER JOIN (SELECT INVOICE_HEADER_ID, COUNT(DISTINCT CONTENEDOR) CONTES FROM INVOICE_DETAIL GROUP BY INVOICE_HEADER_ID) CONTE
                                                        ON CONTE.INVOICE_HEADER_ID = IH.ID
                                        LEFT JOIN PAYMENT P ON IH.PAYMENT_ID = P.ID,
                                      (
                                        SELECT IHD.ID, CONTENEDOR, ISO, BUQUE_NOMBRE, BUQUE_VIAJE, SUM(IMP_TOT * V.TYPE) TOTAL_CON
                                        FROM V_INVOICE_HEADER_DETAIL IHD
                                            INNER JOIN VOUCHER_TYPE V ON V.ID = IHD.COD_TIPO_COMPROB
                                        GROUP BY IHD.ID, CONTENEDOR, ISO, BUQUE_NOMBRE, BUQUE_VIAJE
                                      ) IDE
                                    WHERE IH.ID = IDE.ID AND ${strWhere}
                                          CONTENEDOR = :1 AND IH.TERMINAL = :2`;

                        connection.execute(strSql, [params.container, params.terminal], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                let result = data.rows.map(item => ({
                                    _id: item.ID,
                                    terminal: item.TERMINAL,
                                    tipo: item.TIPO,
                                    codTipoComprob: item.COD_TIPO_COMPROB,
                                    nroComprob: item.NRO_COMPROB,
                                    razon: item.RAZON,
                                    buque: item.BUQUE_NOMBRE,
                                    viaje: item.BUQUE_VIAJE,
                                    contes: item.CONTES,
                                    total: item.TOTAL,
                                    iso: item.ISO,
                                    importe: {total: item.IMPORTE_TOTAL},
                                    importeContenedor: item.TOTAL_CON,
                                    importeContenedorPes: item.TOTAL_CON_PES,
                                    cotiMoneda: item.COTI_MONEDA,
                                    codMoneda: item.COD_MONEDA,
                                    fecha: {emision: item.FECHA_EMISION},
                                    nroPtoVenta: item.NRO_PTO_VENTA,
                                    estado: {
                                        state: item.STATE,
                                        group: item.GRUPO,
                                        user: item.USR
                                    },
                                    payment: {
                                        preNumber: item.PAYMENT_PRE_NUMBER,
                                        number: item.PAYMENT_NUMBER
                                    }
                                }));
                                resolve({
                                    status: "OK",
                                    data: result});
                            }
                        });
                    }
                });
            } else {
                reject({
                    status: "ERROR",
                    message: "Error en el Servidor de Base de Datos"
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
        this.price = require('../include/price.js');
        this.comments = require('../models/comment.js');
        this.matchPrice = require('../models/matchPrice.js');
        this.voucherType = require('../models/voucherType');
    }

    add (param, io, callback) {
        var self = this;
        var invoice,
            errMsg,
            subTotalCheck,
            usr = param.usr,
            postData = param,
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

            //          delete param.usr;

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
                    fecha = (container.fecha !== undefined && container.fecha !== "" && container.fecha !== null) ? moment(container.fecha, "YYYY-MM-DD") : "";
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
                        iso: container.iso,
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
                        if (callback) {return callback({
                            status: "ERROR",
                            message: errMsg,
                            data: postData
                        });}
                    }
                    invoice.detalle.push(cont);
                });

            } else {
                errMsg = util.format("El comprobante no posee detalles. %s. - %j", usr.terminal, postData);
                if (callback) { return callback({
                    status: "ERROR",
                    message: errMsg,
                    data: postData
                });}
            }

        } catch (error) {
            strSubject = util.format("AGP - %s - ERROR", usr.terminal);
            body = util.format('Error al insertar comprobante. %s. \n%s',  error.message, JSON.stringify(postData));

            mailer = new mail.mail(config.email);
            mailer.send(usr.email, strSubject, body, function () {});
            if (callback) {return callback({
                status: "ERROR",
                message: body,
                data: body
            });}
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
                    commentState = 'T';
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
                        callback({status: "ERROR", message: err.message, data: err});
                    } else {
                        data.comment.push(commentAdded._id);
                        data.save((err) => {
                            if (callback) {return callback(undefined, {
                                status: "OK",
                                data: data
                            });}
                        });
                    }
                });

            } else {
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

                            if (callback) {return callback({
                                status: "ERROR",
                                message: "Error insertando Comprobante",
                                data: errMsg
                            });}
                        }

                    });
                } else {
                    strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                    errMsg = util.format('Invoice INS: %s -\n%s - %s', errSave, JSON.stringify(postData), usr.terminal);

                    mailer = new mail.mail(config.email);
                    mailer.send(usr.email, strSubject, errMsg, function () {});
                    if (callback) {return callback({
                        status: "ERROR",
                        data: errMsg
                    });}
                }
            }
        });
    }

    addState (params) {
        return new Promise((resolve, reject) => {

            Invoice.update({_id: params.invoiceId, 'estado.grupo': params.group},
                {$set: {'estado.$.estado' : params.estado}},
                function (err, rowAffected, data){
                    if (err) {
                        reject({status:'ERROR', message: 'Error en cambio de estado.', data: err});
                    } else  {

                        if (rowAffected === 0) {
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

    setSize () {
        return new Promise((resolve, reject) => {
            reject({status: "ERROR",
                message: "NOT IMPLEMENTED"});
        });
    }

    getInvoice (params) {
        return new Promise((resolve, reject) => {
            var param = {
                    _id: params._id
                },
                invoice;

            if (params.terminal) {
                param.terminal = params.terminal;
            }

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
                param["fecha.emision"].$gte = fecha;
            }
            if (filtro.fechaFin) {
                fecha = moment(filtro.fechaFin, 'YYYY-MM-DD').toDate();
                param["fecha.emision"].$lte = fecha;
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
                'total': 1,
                'cotiMoneda': 1,
                'codMoneda': 1,
                detalle: 1,
                estado:1,
                'fecha.emision': 1,
                resend: 1
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
                if (err) {
                    asyncCallback(err);
                } else {
                    asyncCallback(undefined, invoices);
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
                if (callback !== undefined) { return callback({status: "ERROR", message: err.message, data: err}); }
            } else {
                result = {
                    status: 'OK',
                    data: datos,
                    pageCount: (limit > datos.length) ? datos.length : limit,
                    page: skip,
                    totalCount: cnt
                };
                if (callback !== undefined) { return callback(undefined,  result); }
            }
        });

    }

    getInvoicesCSV (params) {
        return new Promise ((resolve, reject) => {
           reject({
               status: "ERROR",
               message: "NOT IMPLEMENTED"
           })
        });
    }

    getClients (params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };

        this.model.distinct('razon', jsonParam, (err, data) => {
            if (err) {
                if (callback) { callback({status: "ERROR", message: err.message, data: err}); }
            } else {
                data = data.sort();
                if (callback) { callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                }); }
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
                if (callback) { callback({status: "ERROR", message: err.message, data: err}); }
            } else {
                data = data.sort();
                if (callback) { callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                }); }
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
        match.$match = {'fecha.emision' : {$gte: fechaEmision, '$lt': tomorrow}};
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
                if (callback) {return callback({status: "ERROR", data: err.message});}
            } else {
                if (callback) {return callback(undefined, {status: 'OK', data: data});}
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
            params.$or = [
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

    getCorrelative (params) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });

/*
        var usr = req.usr,
            fecha,
            param = {},
            cashBoxes,
            cashboxExecs,
            contadorFaltantesTotal,
            async;

        log.time("totalTime");

        if (usr.role === 'agp') {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        if (req.query.fechaInicio || req.query.fechaFin) {
            param["fecha.emision"] = {};
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, 'YYYY-MM-DD').toDate();
                param["fecha.emision"].$gte = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, 'YYYY-MM-DD').toDate();
                param["fecha.emision"].$lte = fecha;
            }
        }
        cashBoxes = [];
        if (req.query.nroPtoVenta) {
            cashBoxes = req.query.nroPtoVenta.split(',');
        } else {
            log.logger.error("El nro de punto de venta no ha sido enviado");
            res.status(403).send({status: "ERROR", data: "El nro de punto de venta no ha sido enviado" });
        }
        if (req.query.codTipoComprob) {
            param.codTipoComprob = parseInt(req.query.codTipoComprob, 10);
        }

        cashboxExecs = [];
        contadorFaltantesTotal = 0;

        cashBoxes.forEach(function (cash) {
            //funcion que calcula la correlatividad por cada caja que sera ejecutada en paralelo async
            var cashboxExec = function (callback) {
                var invoices,
                    logTimeBase;
                param.nroPtoVenta = parseInt(cash, 10);

                invoices = Invoice.find(param, {nroComprob: 1, 'fecha.emision': 1, _id: 0});
                invoices.sort({nroComprob: 1});
                invoices.lean();

                invoices.exec(function (err, invoicesData) {
                    var fecha,
                        faltantes = [],
                        control = 0,
                        contadorFaltantes = 0,
                        result,
                        dif,
                        item2Add,
                        i,
                        len;

                    if (!err) {
                        invoicesData.forEach(function (invoice) {
                            if (control === 0) {
                                control = invoice.nroComprob;
                            } else {
                                control += 1;
                                if (control !== invoice.nroComprob) {
                                    fecha = moment(invoice.fecha.emision).format("YYYY-MM-DD");
                                    if (invoice.nroComprob - control > 3) {
                                        dif = (invoice.nroComprob) - control;
                                        contadorFaltantes+= dif;
                                        item2Add = util.format('[%d a %d] (%d)', control, (invoice.nroComprob - 1), dif);
                                        faltantes.push({n: item2Add, d: fecha});
                                    } else {
                                        len=invoice.nroComprob;
                                        for (i=control; i<len; i++) {
                                            faltantes.push({n: i.toString(), d: fecha});
                                            contadorFaltantes++;
                                        }
                                    }
                                    control = invoice.nroComprob;
                                }
                            }
                        });
                        contadorFaltantesTotal += contadorFaltantes;
                        result = {
                            status: 'OK',
                            nroPtoVenta: cash,
                            totalCount: contadorFaltantes,
                            data: faltantes
                        };
                        //io.sockets.emit('correlative', result);
                        io.sockets.emit('correlative_'+req.query.x, result);
                        return callback(null, result);
                    } else {
                        log.logger.error("%s", err.message);
                        res.status(500).send({status: "ERROR", data: {name: err.name, message: err.message} });
                    }
                });
            };

            cashboxExecs.push(cashboxExec);
        });

        async = require('async');
        async.parallel(cashboxExecs, function (err, results) {
            var response = {
                status: "OK",
                totalCount: contadorFaltantesTotal,
                data: results,
                time: log.timeEnd("totalTime")
            };
            res.status(200).send(response);

        });
*/

    }

    getDistinct (distinct, params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };

        this.model.distinct(distinct, jsonParam, function (err, data) {
            if (err) {
                if (callback) {return callback({status: "ERROR", message: err.message, data: err});}
            } else {
                data = data.sort();
                if (callback) {return callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                });}
            }
        });
    }

    getLastInsert (terminal, lastHours) {
        return new Promise((resolve, reject) => {

            this.model.find({terminal: terminal}, {'_id': 1})
                .sort({_id: -1})
                .limit(1)
                .lean()
                .exec((err, data) => {

                    if (err) {
                        reject({
                            status: 'ERROR',
                            message: err.message,
                            data: err
                        });
                    } else {
                        let moment = require('moment');
                        let result = data[0];
                        let fecha = moment(result._id.getTimestamp()).add(lastHours, 'hour');
                        if (fecha < moment()) {
                            reject({
                                status: "ERROR",
                                data: {
                                    lastInsert: result._id.getTimestamp()
                                }
                            });
                        } else {
                            resolve({
                                status: "OK",
                                data: {
                                    lastInsert: result._id.getTimestamp()
                                }
                            });
                        }
                    }
                });
        });
    }

    getRatesByPeriod (params) {
        return new Promise((resolve, reject) => {
            var desde,
                hasta,
                cond,
                _price,
                _rates;
            var Enumerable = require("linq");
            var moment = require("moment");

            desde = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
            hasta = moment(params.fechaFin, 'YYYY-MM-DD').toDate();

            this.voucherType.find({type: -1}, (err, vouchertypes) => {
                if (err) {
                    reject({
                        status: 'ERROR',
                        message: err.message,
                        data : err
                    });
                } else {
                    cond = Enumerable.from(vouchertypes)
                        .select(item => {
                            if (item.type === -1) {
                                return {$eq: [ "$codTipoComprob", item._id]};
                            }
                        }).toArray();

                    _price = require('../include/price.js');
                    _rates = new _price.price();
                    _rates.ratePrices((err, prices) => {
                        var invoice,
                            param,
                            rates;

                        rates = Enumerable.from(prices)
                            .select('z=>z.code')
                            .toArray();

                        if (err) {
                            reject({
                                status: 'ERROR',
                                message: err.message,
                                data : err
                            });
                        } else {
                            param = [
                                { $match : {
                                    'fecha.emision': {$gte: desde, $lt: hasta}
                                }},
                                { $unwind : '$detalle'},
                                { $unwind : '$detalle.items'},
                                { $match : {
                                    'detalle.items.id' : { $in : rates}
                                }},
                                {$project : {
                                    terminal: '$terminal',
                                    code: '$detalle.items.id',
                                    date: '$fecha.emision',
                                    cotiMoneda: '$cotiMoneda',
                                    cnt: { $cond: [
                                        {$or : cond },
                                        {$multiply: ['$detalle.items.cnt', -1]},
                                        '$detalle.items.cnt'
                                    ]},
                                    impUnit: '$detalle.items.impUnit',
                                    impTot: '$detalle.items.impTot'
                                }}];
                            invoice = this.model.aggregate(param);

                            invoice.exec((err, data) => {
                                var mp,
                                    result;

                                if (err) {
                                    reject({
                                        status: 'ERROR',
                                        message: err.message,
                                        data : err
                                    });
                                } else {

                                    result = Enumerable.from(data)
                                        .join(Enumerable.from(prices), '$.code', '$.code', (tasaInvoice, price) => {
                                            tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                            tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                            tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                            tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                            tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                            return tasaInvoice;
                                        })
                                        .groupBy('x=>JSON.stringify({code: x.code, terminal: x.terminal, date: x.date})', null,
                                        (key, g) => {
                                            var r;
                                            key = JSON.parse(key);
                                            r = {
                                                _id: {code: key.code, terminal: key.terminal, date: key.date},
                                                cnt: g.sum("$.cnt"),
                                                total: g.sum("$.tasa"),
                                                totalPeso: g.sum("$.totalTasa"),
                                                totalAgp: g.sum("$.tasaAgp"),
                                                totalPesoAgp: g.sum("$.totalTasaAgp")
                                            };
                                            r.cnt = Math.abs(r.cnt);
                                            return r;
                                        }).toArray();

                                    mp = this.matchPrice.find({match: {$in: rates}}, {price: true, match : true});
                                    mp.populate({path: 'price', match: {rate: {$exists: true}}});
                                    mp.exec((err, dataMatch) => {

                                        if (err) {
                                            reject({
                                                status: 'ERROR',
                                                message: err.message,
                                                data : err
                                            });
                                        } else {
                                            mp = Enumerable.from(dataMatch)
                                                .select( item => {
                                                    return {code: item.match[0], rate: item.price.toObject().rate};
                                                }).toArray();
                                            mp = Enumerable.from(result)
                                                .join(Enumerable.from(mp), '$._id.code', '$.code', (left, right) => {
                                                    return {
                                                        code : right.code,
                                                        rate: right.rate,
                                                        terminal: left._id.terminal,
                                                        date: left._id.date,
                                                        ton: left.cnt,
                                                        total: left.total,
                                                        totalPeso: left.totalPeso,
                                                        totalAgp: left.totalAgp,
                                                        totalPesoAgp: left.totalPesoAgp
                                                    };
                                                })
                                                .orderBy('$.date').thenBy('$.terminal')
                                                .toArray();

                                            resolve({status: 'OK', data : mp});
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });

        });
    }

    getRatesByTerminal (params) {
        return new Promise((resolve, reject) => {
            var desde,
                hasta,
                cond,
                _price,
                _rates;
            var Enumerable = require("linq");
            var moment = require("moment");

            desde = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
            hasta = moment(params.fechaFin, 'YYYY-MM-DD').toDate();

            this.voucherType.find({type: -1}, (err, vouchertypes) => {
                if (err) {
                    reject({
                        status: 'ERROR',
                        message: err.message,
                        data: err
                    });
                } else {
                    cond = Enumerable.from(vouchertypes)
                        .select(item => {
                            if (item.type === -1) {
                                return {$eq: ["$codTipoComprob", item._id]};
                            }
                        }).toArray();

                    _price = require('../include/price.js');
                    _rates = new _price.price();
                    _rates.ratePrices((err, prices) => {
                        var invoice,
                            param,
                            rates;

                        rates = Enumerable.from(prices)
                            .select('z=>z.code')
                            .toArray();

                        if (err) {
                            reject({
                                status: 'ERROR',
                                message: err.message,
                                data: err
                            });
                        } else {
                            param = [
                                {
                                    $match: {
                                        'fecha.emision': {$gte: desde, $lt: hasta}
                                    }
                                },
                                {$unwind: '$detalle'},
                                {$unwind: '$detalle.items'},
                                {
                                    $match: {
                                        'detalle.items.id': {$in: rates}
                                    }
                                },
                                {
                                    $project: {
                                        terminal: '$terminal',
                                        code: '$detalle.items.id',
                                        cotiMoneda: '$cotiMoneda',
                                        cnt: {
                                            $cond: [
                                                {$or: cond},
                                                {$multiply: ['$detalle.items.cnt', -1]},
                                                '$detalle.items.cnt'
                                            ]
                                        },
                                        impUnit: '$detalle.items.impUnit',
                                        impTot: '$detalle.items.impTot'
                                    }
                                }];
                            invoice = this.model.aggregate(param);

                            invoice.exec((err, data) => {
                                var result;

                                if (err) {
                                    reject({
                                        status: 'ERROR',
                                        message: err.message,
                                        data: err
                                    });
                                } else {

                                    result = Enumerable.from(data)
                                        .join(Enumerable.from(prices), '$.code', '$.code', (tasaInvoice, price) => {
                                            tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                            tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                            tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                            tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                            tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                            tasaInvoice.codeAgp = price.price.code;
                                            console.log(tasaInvoice)
                                            return tasaInvoice;
                                        })
                                        .groupBy('x=>JSON.stringify({code: x.code, terminal: x.terminal})', null,
                                        (key, g) => {
                                            var r;
                                            key = JSON.parse(key);
                                            r = {
                                                _id: {code: key.code, terminal: key.terminal},
                                                cnt: g.sum("$.cnt"),
                                                total: g.sum("$.tasa"),
                                                totalPeso: g.sum("$.totalTasa"),
                                                totalAgp: g.sum("$.tasaAgp"),
                                                totalPesoAgp: g.sum("$.totalTasaAgp")
                                            };
                                            r.cnt = Math.abs(r.cnt);
                                            return r;
                                        }).toArray();

                                    this.matchPrice.aggregate([
                                        {$project: {price: true, match: true}},
                                        {$match: {match: {$in: rates}}},
                                        {$unwind: '$match'},
                                        {
                                            $project: {
                                                code: '$match',
                                                price: '$price'
                                            }
                                        }
                                    ])
                                        .exec((err, data) => {
                                            this.matchPrice.populate(data, {
                                                path: 'price',
                                                match: {rate: {$exists: true}}
                                            }, (err, data) => {
                                                let mp = data.map(item => {
                                                    return {code: item.code, rate: item.price.rate};
                                                });

                                                mp = Enumerable.from(result)
                                                    .join(Enumerable.from(mp), '$._id.code', '$.code', (left, right) => {
                                                        return {
                                                            code: right.code,
                                                            rate: right.rate,
                                                            terminal: left._id.terminal,
                                                            ton: left.cnt,
                                                            total: left.total,
                                                            totalPeso: left.totalPeso,
                                                            totalAgp: left.totalAgp,
                                                            totalPesoAgp: left.totalPesoAgp
                                                        };
                                                    }).toArray();

                                                resolve({status: 'OK', data: mp});
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    getRatesByContainer (params) {
        return new Promise((resolve, reject) => {
            var paramTerminal = params.terminal,
                ter,
                _price,
                _rates,
                sum = {},
                buque,
                viaje,
                jsonParam,
                match;

            _price = this.price;
            _rates = new _price.price(paramTerminal);
            _rates.rates((err, rates) => {

                if (params.currency === 'PES') {
                    sum = { $cond: [
                        {$eq: ['$codMoneda', 'PES' ]},
                        '$detalle.items.impTot',
                        {$multiply: ['$detalle.items.impTot', '$cotiMoneda'] }
                    ]};
                } else if (params.currency === 'DOL') {
                    sum = { $cond: [
                        {$eq: ['$codMoneda', 'DOL' ]},
                        '$detalle.items.impTot',
                        {$divide: ['$detalle.items.impTot', '$cotiMoneda'] }
                    ]};
                }

                match = {
                    terminal: ter,
                    'detalle.items.id' : {$in: rates},
                    'detalle.contenedor' : params.container
                };
                if (params.buqueNombre) {
                    match['detalle.buque.nombre'] = params.buqueNombre;
                }
                if (params.viaje) {
                    match['detalle.buque.viaje'] = params.viaje;
                }

                jsonParam = [
                    {   $match: match},
                    {$unwind : '$detalle'},
                    {$unwind : '$detalle.items'},
                    {$match : {
                        'detalle.items.id' : {$in: rates},
                        'detalle.contenedor' : params.container
                    }},
                    {$project : {terminal: 1, 'detalle.items': 1, total : sum }},
                    {
                        $group  : {
                            _id: {
                                terminal: '$terminal',
                                id: '$detalle.items.id'
                            },
                            cnt: { $sum: '$detalle.items.cnt'},
                            total: {$sum: '$total'}
                        }
                    },
                    {$project: {
                        terminal: '$_id.terminal'},
                        code: '$_id.id',
                        cnt: 1,
                        total: 1
                    }
                ];

                this.model.aggregate(jsonParam, (err, data) => {
                    if (err) {
                        reject({status: 'ERROR', data: err.message });
                    } else {
                        console.log(data);
                        resolve({status: 'OK', data: data });
                    }
                });
            });
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
        var moment = require('moment');

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
                        param["fecha.emision"].$gte = fecha;
                    }
                    if (params.fechaFin) {
                        fecha = moment(moment(params.fechaFin, 'YYYY-MM-DD')).toDate();
                        param["fecha.emision"].$lte = fecha;
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
                        if (callback) {return callback(undefined, dataResult);}
                    });
                });
            } else {
                errorResult = {
                    status: 'ERROR',
                    data: 'La terminal no tiene Tasa a las Cargas Asociadas.'
                };
                if (callback) {return callback(errorResult);}
            }
        });

    }

    getNoMatches (params) {
        return new Promise((resolve, reject) => {
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
                            match["fecha.emision"].$gte = fecha;
                        }
                        if (params.fechaFin) {
                            fecha = moment(params.fechaFin, 'YYYY-MM-DD').toDate();
                            match["fecha.emision"].$lte = fecha;
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
                    reject({status: 'ERROR', data: err.message});
                }
            });
        });
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
                    param.razon = {$regex: params.razonSocial};
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
                        param["fecha.emision"].$gte = fecha;
                    }
                    if (params.fechaFin) {
                        fecha = moment(params.fechaFin, 'YYYY-MM-DD').toDate();
                        param["fecha.emision"].$lte = fecha;
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
                            asyncCallback(err);
                        } else {
                            let contDist = Enumerable.from(data2).select('$.contenedor');
                            asyncCallback(undefined, contDist);
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
                if (callback) {callback({status: "ERROR", message: err.message, data: err});}
            } else {
                data = data.sort();
                if (callback) {callback(undefined, {
                    status: "OK",
                    totalCount: data.length,
                    data: data
                });}
            }
        });
    }

    getShipContainers (params) {
        return new Promise((resolve, reject) => {
            var param,
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
                    reject({
                        status: 'ERROR',
                        message: err.message,
                        data: err.message});
                } else {
                    let cond = vouchertypes.map(item => {
                        if (item.type === -1) {
                            return {$eq: ["$codTipoComprob", item._id]};
                        }
                    });

                    rates.rates((err, ratesArray) => {

                        query = [
                            {$match: param},
                            {$unwind: '$detalle'},
                            {$match: {'detalle.buque.nombre': params.buque, 'detalle.buque.viaje': params.viaje}},
                            {$unwind: '$detalle.items'},
                            {$match: {'detalle.items.id': {$in: ratesArray}}},
                            {
                                $group: {
                                    _id: {
                                        contenedor: '$detalle.contenedor'
                                    },
                                    tonelada: { $sum: {
                                        $cond: [{$or: cond}, {$multiply: ['$detalle.items.cnt', -1]}, '$detalle.items.cnt' ]
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
                                reject({
                                    status: 'ERROR',
                                    message: err.message,
                                    data: err.message
                                });
                            } else {

                                param = {
                                    terminal: params.terminal,
                                    buque: params.buque,
                                    viaje: params.viaje
                                };
                                Gate.find(param, (err, dataGates) => {
                                    var Enumerable,
                                        response;

                                    if (err) {
                                        reject({
                                            status: 'ERROR',
                                            message: err.message,
                                            data: err.message
                                        });
                                    } else {
                                        Enumerable = require('linq');

                                        response = Enumerable.from(dataContainers)
                                            .groupJoin(dataGates, '$.contenedor', '$.contenedor', (inner, outer) => {

                                                if (outer.getSource !== undefined) {
                                                    inner.gatesCnt = outer.getSource().length;
                                                }
                                                return inner;
                                            }).toArray();

                                        resolve({
                                            status: 'OK',
                                            totalCount: dataContainers.length,
                                            data: response
                                        });
                                    }
                                });
                            }
                        });

                    });
                }
            });
        });
    }

    getShipTrips (params) {
        return new Promise((resolve, reject) => {
            var moment = require('moment');

            this.model.aggregate([
                { $match: params },
                { $unwind : '$detalle'},
                { $group: {_id: {buque: '$detalle.buque.nombre', viaje: '$detalle.buque.viaje', fecha: '$detalle.buque.fecha'} } },
                { $sort: { '_id.buque': 1, '_id.fecha': 1} },
                { $project : {buque: '$_id.buque', viaje: '$_id.viaje', fecha: '$_id.fecha', _id: false}}
            ], (err, data) => {
                var Enumerable,
                    resultTer;
                if (err) {
                    reject({status: 'ERROR', data: err.message});
                } else {
                    Enumerable = require('linq');
                    var prop,
                        ter;
                    resultTer = Enumerable.from(data)
                        .groupBy("$.buque" , null, (key, g) => {
                            prop = g.getSource();
                            ter = {
                                buque: key,
                                viajes: prop.map(item => (
                                    [item.viaje, (item.fecha ? moment(item.fecha).format("DD-MM-YYYY") : "")]
                                )),
                                both: false
                            };
                            return (ter);
                        }).toArray();

                    resolve({status: 'OK', data: resultTer});

                    //var Registro1SumImpoMani = require('' +
                    //    '../lib/afip/registro1_sumImpoMani.js');
                    //Registro1SumImpoMani = new Registro1SumImpoMani(this.cn);
                    //Registro1SumImpoMani.getShipsTrips({})
                    //.then(data => {
                    //        var dataOra = Enumerable.from(data.rows).select(item => {
                    //            return {"buque": item.BUQUE, fecha: item.FECHA};
                    //        }).toArray();
                    //        var dataQ = Enumerable.from(resultTer).groupJoin(dataOra, '$.buque', '$.buque', (item, g) => {
                    //            var both = false;
                    //            if (g.getSource !== undefined) {
                    //                both = true;
                    //            }
                    //            return {
                    //                buque: item.buque,
                    //                viajes: item.viajes,
                    //                both: both
                    //            };
                    //        }).toArray();
                    //
                    //        resolve({status: 'OK', data: dataQ});
                    //    })
                    //.catch(err => {
                    //        console.log("%s, Error en Oracle getShipTrips.", new Date());
                    //        reject({status: 'ERROR', message: err.message, data: err});
                    //    });
                }
            });

        });
    }

    getTotales (params) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET"
            });
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

            if (callback) {return callback(err, result);}
        });
    }

    getTotalByClient (params, options) {
        return new Promise ((resolve, reject) => {
            var param,
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
                    min: {$min: "$total"},
                    max: {$max: "$total"},
                    cnt: {$sum: 1},
                    avg: {$avg: "$total"}
                }},
                {$project: {
                    _id: false,
                    terminal: "$_id.terminal",
                    cuit: '$_id.cuit',
                    razon: "$_id.razon",
                    total: true,
                    min: true,
                    max: true,
                    cnt: true,
                    avg: true
                }},
                {$sort: {"total": -1}}
            ];
            if (params.top) {
                paramLocal.push({$limit: parseInt(params.top) });
            }

            invoices = Invoice.aggregate(paramLocal);

            invoices.exec((err, data) => {
                var total,
                    result,
                    response;

                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    total = Enumerable.from(data)
                        .sum('$.total');

                    if (options.output === 'csv') {
                        response = "CUIT|RAZON|COMP|MINIMA|PROMEDIO|MAXIMA|TOTAL\n";

                        data.forEach(function (item) {
                            response = response +
                                item.cuit +
                                "|" +
                                item.razon +
                                "|" +
                                item.cnt +
                                "|" +
                                item.min +
                                "|" +
                                item.avg +
                                "|" +
                                item.max +
                                "|" +
                                item.total +
                                "\n";
                        });
                        resolve({
                            status: "OK",
                            data: response
                        });
                    } else {
                        result = {
                            status: "OK",
                            data: data,
                            total: total,
                            totalCount: data.length
                        };
                        resolve(result);
                    }
                }
            });
        });
    }

    getInvoicesByRatesTerminal (params, options) {
        return new Promise((resolve, reject) => {
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
            invoices.exec((err, data) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    if (options.output === 'csv') {

                        var matchPrice = require('../lib/matchPrice.js'),
                            param = {terminal: params.terminal};

                        matchPrice = new matchPrice(params.terminal);
                        matchPrice.getMatches(param, (err, result) => {
                            if (err) {
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
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
                                resolve({
                                    status: "OK",
                                    data: response
                                });
                            }
                        });
                    } else {
                        resolve({
                            status: "OK",
                            data: data
                        });
                    }
                }
            });
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

    getByCode (code, terminal) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getByContainer (container, terminal) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
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
            //this.type = this.ORACLE;
        } else {
            this.connection = require('../models/invoice.js');
            this.clase = new InvoiceMongoDB(this.connection);
            //this.type = this.MONGODB;
        }
    }

    add (param, io, callback) {
        this.clase.add(param, io, callback);
    }

    addState (params, cn) {
        return this.clase.addState(params, cn);
    }

    getInvoice (params) {
        return this.clase.getInvoice(params);
    }

    getInvoices (params, callback) {
        this.clase.getInvoices(params, callback);
    }

    getInvoicesCSV (params) {
        return this.clase.getInvoicesCSV(params);
    }

    getCashbox (params) {
        return new Promise((resolve, reject) => {
            this.clase.getCashbox(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });

    }

    getClients (params) {
        return new Promise((resolve, reject) => {
            this.clase.getClients(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    getContainers (params) {
        return new Promise((resolve, reject) => {
            this.clase.getContainers(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
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
        return this.clase.getCorrelative(params);
    }

    getDistinct (distinct, params, callback) {
        this.clase.getDistinct(distinct, params, callback);
    }

    getLastInsert (terminal, lastHours) {
        return this.clase.getLastInsert(terminal, lastHours);
    }

    getNoMatches (params) {
        return this.clase.getNoMatches(params);
    }

    getRatesByPeriod (params) {
        return this.clase.getRatesByPeriod(params);
    }

    getRatesByTerminal (params) {
        return this.clase.getRatesByTerminal(params);
    }

    getRatesByContainer (params) {
        return this.clase.getRatesByContainer(params);
    }

    getNoRates (params, callback) {
        this.clase.getNoRates(params, callback);
    }

    getContainersNoRates (params, callback) {
        this.clase.getContainersNoRates(params, callback);
    }

    getShips (params) {
        return new Promise((resolve, reject) => {
            this.clase.getShips(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    getShipContainers (params) {
        return this.clase.getShipContainers(params);
    }

    getShipTrips (params) {
        return this.clase.getShipTrips(params);
    }

    getTotales (params) {
        return this.clase.getTotales(params);
    }

    getTotal (params, callback) {
        this.clase.getTotal(params, callback);
    }

    getTotalByClient (params, options) {
        return this.clase.getTotalByClient(params, options);
    }

    getInvoicesByRatesTerminal (params, options) {
        return this.clase.getInvoicesByRatesTerminal(params, options);
    }

    setResend (id, resend) {
        return this.clase.setResend(id, resend);
    }

    getByCode (code, terminal) {
        return this.clase.getByCode(code, terminal);
    }

    getByContainer (container, terminal) {
        return this.clase.getByContainer(container, terminal);
    }

    getTotalByContainer (params) {
        return this.clase.getTotalByContainer(params);
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }
}

module.exports = Invoice;