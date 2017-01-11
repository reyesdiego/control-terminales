/**
 * Created by diego on 12/21/15.
 */
"use strict";

class PayingOracle {
    constructor(connection, terminal) {
        this.terminal = terminal;
        this.cn = connection;
    }

    addPrePayment(prePayment) {
        return new Promise((resolve, reject) => {
            var strSql,
                values;
            var pool = this.cn.pool;
            var moment = require("moment");

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add Payment.", new Date());
                        reject(err);
                    } else {
                        strSql = `INSERT INTO PAYMENT
                                (ID,
                                PAYMENT_PRE_NUMBER,
                                TERMINAL,
                                FECHA,
                                ACCOUNT) VALUES (
                                    PAYMENTS_SEQ.NEXTVAL,
                                    PAYMENTS_PRE_NUMBER_SEQ.NEXTVAL,
                                    :terminal,
                                    to_date(:fecha, 'YYYY-MM-DD HH24:MI:SS'),
                                    :account ) RETURNING ID, PAYMENT_PRE_NUMBER INTO :outputId, :outputPayment_PreNumber`;
                        values = {
                            outputId: {type: this.cn.oracledb.NUMBER, dir: this.cn.oracledb.BIND_OUT},
                            outputPayment_PreNumber: {type: this.cn.oracledb.NUMBER, dir: this.cn.oracledb.BIND_OUT},
                            terminal: this.terminal,
                            fecha: moment(prePayment.fecha).format("YYYY-MM-DD HH:mm:ss"),
                            account: prePayment.user.user
                        };
                        connection.execute(strSql, values, {autoCommit: true}, (err, result) => {
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
                                    data: {
                                        preNumber: result.outBinds.outputPayment_PreNumber[0]
                                    }
                                });
                            }
                        });

                    }
                });
            }
        });
    }

    deletePrePayment (paymentId) {
        return new Promise((resolve, reject) => {
            var strSql;
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add deletePrePayment.", new Date());
                        reject(err);
                    } else {
                        strSql = `DELETE PAYMENT WHERE ID = :1`;
                        connection.execute(strSql, [paymentId], {autoCommit: false}, (err, result) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                strSql = `UPDATE INVOICE_HEADER
                                           SET PAYMENT_ID = NULL
                                           WHERE PAYMENT_ID = :1`;
                                connection.execute(strSql, [paymentId], {autoCommit: false}, (err, resultUpdate) => {
                                    connection.commit((err, data) => {
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
                                                message: `Se ha eliminado la Pre Liquidación #${paymentId}`
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    getNotPayed (params, options) {
        return new Promise((resolve, reject) => {
            var strSql,
                limit,
                skip,
                container = '',
                strWhere = '',
                strWhereGral = '',
                orderBy = ' VHD.ID ',
                task,
                tasks = [];

            var async = require('async');
            var pool = this.cn.pool;
            var moment = require("moment");

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add Gate.", new Date());
                        reject(err);
                    } else {

                        if (params._id) {
                            strWhere += `PAYMENT_ID = ${params._id} AND `;
                        } else {

                            strWhere += `PAYMENT_ID IS NULL AND `;

                            if (params.fechaInicio) {
                                strWhere += `FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }
                            if (params.fechaFin) {
                                strWhere += `FECHA_EMISION < TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }
                            if (params.codTipoComprob) {
                                strWhere += `COD_TIPO_COMPROB = ${params.codTipoComprob} AND `;
                            }
                            if (params.buqueNombre) {
                                strWhere += `BUQUE_NOMBRE = '${params.buqueNombre}' AND `;
                            }
                            if (params.razonSocial) {
                                strWhere += `RAZON = '${params.razonSocial}' AND `;
                            }
                            if (params.contenedor) {
                                strWhere += `CONTENEDOR = '${params.contenedor}' AND `;
                            }
                        }
                        if (strWhere.length > 0) {
                            strWhere = strWhere.substr(0, strWhere.length - 4);
                        }

                        if (options.byContainer === '1') {
                            container = `CONTENEDOR,`;
                        }
                        if (options.order) {
                            orderBy = this.cn.orderBy(options.order).toUpperCase();
                            var order = (orderBy.includes('ASC')) ? ' ASC' : ' DESC';
                            if (orderBy.includes('NROPTOVENTA'))
                                orderBy = 'NRO_PTO_VENTA';
                            else if (orderBy.includes('CODTIPOCOMPROB'))
                                orderBy = 'COD_TIPO_COMPROB';
                            else if (orderBy.includes('RAZON'))
                                orderBy = 'RAZON';
                            else if (orderBy.includes('NROCOMPROB'))
                                orderBy = 'NRO_COMPROB';
                            else if (orderBy.includes('BUQUE'))
                                orderBy = 'BUQUE_NOMBRE';
                            else if (orderBy.includes('EMISION'))
                                orderBy = 'FECHA_EMISION';
                            else if (orderBy.includes('IMPORTE.TOTAL'))
                                orderBy = 'TOTAL';
                            else if (orderBy.includes('CNT'))
                                orderBy = 'SUM(CNT*VOUCHER_TYPE.TYPE)';
                            else if (orderBy.includes('TASA'))
                                orderBy = 'SUM(CNT*IMP_UNIT*VOUCHER_TYPE.TYPE)';
                            else if (orderBy.includes('COTIMONEDA'))
                                orderBy = 'COTI_MONEDA';
                            else if (orderBy.includes('IMPUNIT'))
                                orderBy = 'IMP_UNIT';

                            orderBy += order;
                        }

                        task = (asyncCallback) => {
                            if (options.paginated) {
                                limit = parseInt(options.limit, 10);
                                skip = parseInt(options.skip, 10);
                                strWhereGral = `WHERE R BETWEEN ${skip} AND ${skip + limit}`;
                            }
                            strSql = `SELECT *
                                FROM (
                                  SELECT VHD.ID,
                                        FECHA_EMISION,
                                        COD_TIPO_COMPROB,
                                        BUQUE_NOMBRE,
                                        RAZON,
                                        NRO_PTO_VENTA,
                                        NRO_COMPROB,
                                        COTI_MONEDA,
                                        VHD.CODE,
                                        USR,
                                        GRUPO,
                                        STATE,
                                        ${container}
                                        IMP_UNIT,
                                        PRECIO,
                                        SUM(CNT*VOUCHER_TYPE.TYPE) AS CNT,
                                        SUM(CNT*IMP_UNIT*VOUCHER_TYPE.TYPE) AS TOTAL,
                                        SUM(CNT*PRECIO*VOUCHER_TYPE.TYPE) AS TOTAL_AGP,
                                        SUM(CNT*IMP_UNIT*VOUCHER_TYPE.TYPE*COTI_MONEDA) AS TOTAL_TASA,
                                        SUM(CNT*PRECIO*VOUCHER_TYPE.TYPE*COTI_MONEDA) AS TOTAL_TASA_AGP,
                                        ROW_NUMBER() OVER (ORDER BY ${orderBy}) AS R
                                  FROM V_INVOICE_HEADER_DETAIL VHD
                                      INNER JOIN INVOICE_STATE STA ON  VHD.ID = STA.INVOICE_HEADER_ID AND
                                                           STA.ID = (SELECT MAX(ST1.ID) FROM INVOICE_STATE ST1 WHERE ST1.INVOICE_HEADER_ID = VHD.ID)
                                      INNER JOIN VOUCHER_TYPE ON COD_TIPO_COMPROB = VOUCHER_TYPE.ID
                                      INNER JOIN TARIFARIO_TERMINAL TT ON VHD.CODE = TT.CODE AND VHD.TERMINAL = TT.TERMINAL
                                      INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID AND RATE IS NOT NULL
                                      INNER JOIN TARIFARIO_PRECIO TP ON  TP.TARIFARIO_ID = T.ID AND
                                                TP.FECHA = (SELECT MAX(TP1.FECHA) FROM TARIFARIO_PRECIO TP1 WHERE TP1.TARIFARIO_ID = T.ID AND TP1.FECHA <= VHD.FECHA_EMISION)
                                  WHERE VHD.TERMINAL = :1 AND
                                        ${strWhere}
                                  GROUP BY VHD.ID, FECHA_EMISION, COD_TIPO_COMPROB, BUQUE_NOMBRE, RAZON, NRO_PTO_VENTA, NRO_COMPROB, COTI_MONEDA, VHD.CODE, USR, GRUPO, STATE, ${container} IMP_UNIT, PRECIO
                                )
                                ${strWhereGral}`;
                            connection.execute(strSql, [this.terminal], {}, (err, data) => {
                                asyncCallback(err, data);
                            });
                        };
                        tasks.push(task);

                        task = (asyncCallback) => {
                            strSql = `SELECT COUNT(*) AS TOTAL
                                        FROM (
                                          SELECT VHD.ID
                                          FROM V_INVOICE_HEADER_DETAIL VHD
                                              INNER JOIN INVOICE_STATE STA ON  VHD.ID = STA.INVOICE_HEADER_ID AND
                                                                   STA.ID = (SELECT MAX(ST1.ID) FROM INVOICE_STATE ST1 WHERE ST1.INVOICE_HEADER_ID = VHD.ID)
                                              INNER JOIN VOUCHER_TYPE ON COD_TIPO_COMPROB = VOUCHER_TYPE.ID
                                              INNER JOIN TARIFARIO_TERMINAL TT ON VHD.CODE = TT.CODE AND VHD.TERMINAL = TT.TERMINAL
                                              INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID AND RATE IS NOT NULL
                                          WHERE VHD.TERMINAL = :1 AND
                                                ${strWhere}
                                          GROUP BY ${container} VHD.ID)`;
                            connection.execute(strSql, [this.terminal], {}, (err, data) => {
                                asyncCallback(err, data);
                            });
                        };
                        tasks.push(task);

                        async.parallel(tasks, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({
                                    status: 'ERROR',
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                this.cn.doRelease(connection);
                                var rows = data[0].rows.map(item => (
                                {
                                    "_id": item.ID,
                                    "cnt": item.CNT,
                                    "cantidad": 9999999,
                                    "terminal": this.terminal,
                                    "emision": item.FECHA_EMISION,
                                    "nroPtoVenta": item.NRO_PTO_VENTA,
                                    "codTipoComprob": item.COD_TIPO_COMPROB,
                                    "buque": item.BUQUE_NOMBRE,
                                    "razon": item.RAZON,
                                    "cotiMoneda": item.COTI_MONEDA,
                                    "code": item.CODE,
                                    "impUnit": item.IMP_UNIT,
                                    "tasa": item.TOTAL,
                                    "estado": {
                                        "grupo": item.GRUPO,
                                        "user": item.USR,
                                        "estado": item.STATE
                                    },
                                    "container": item.CONTENEDOR,
                                    "nroComprob": item.NRO_COMPROB,
                                    "impUnitAgp": item.PRECIO,
                                    "tasaAgp": item.TOTAL_AGP,
                                    "totalTasa": item.TOTAL_TASA,
                                    "totalTasaAgp": item.TOTAL_TASA_AGP
                                }
                                ));

                                var total = data[1].rows;
                                resolve({
                                    status: 'OK',
                                    totalCount: total[0].TOTAL,
                                    data: rows
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    getPrePayment (params) {
        return new Promise((resolve, reject) => {

            var strSql,
                strWhere = ' AND ';
            var Enumerable = require('linq');

            var async = require('async');
            var pool = this.cn.pool;
            var moment = require("moment");

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle getPrePayment.", new Date());
                        reject(err);
                    } else {

                        if (params.paymentId) {
                            strWhere += `PAYMENT_ID = ${params.paymentId} AND `;
                        } else {

                            strWhere += ` PAYMENT_ID IS NULL AND `;

                            if (params.fechaInicio) {
                                strWhere += `FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }
                            if (params.fechaFin) {
                                strWhere += `FECHA_EMISION < TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }
                            if (params.codTipoComprob) {
                                strWhere += `COD_TIPO_COMPROB = ${params.codTipoComprob} AND `;
                            }
                            if (params.buqueNombre) {
                                strWhere += `BUQUE_NOMBRE = '${params.buqueNombre}' AND `;
                            }
                            if (params.razonSocial) {
                                strWhere += `RAZON = '${params.razonSocial}' AND `;
                            }
                            if (params.contenedor) {
                                strWhere += `CONTENEDOR = '${params.contenedor}' AND `;
                            }
                        }
                        if (strWhere.length > 0) {
                            strWhere = strWhere.substr(0, strWhere.length - 4);
                        }

                        strSql = ` SELECT VHD.CODE,
                                        SUM(CNT*VOUCHER_TYPE.TYPE) AS CNT,
                                        SUM(CNT*IMP_UNIT*VOUCHER_TYPE.TYPE) AS TOTAL,
                                        SUM(CNT*PRECIO*VOUCHER_TYPE.TYPE) AS TOTAL_AGP,
                                        SUM(CNT*IMP_UNIT*VOUCHER_TYPE.TYPE*COTI_MONEDA) AS TOTAL_TASA,
                                        SUM(CNT*PRECIO*VOUCHER_TYPE.TYPE*COTI_MONEDA) AS TOTAL_TASA_AGP
                                    FROM V_INVOICE_HEADER_DETAIL VHD
                                    INNER JOIN INVOICE_STATE STA ON  VHD.ID = STA.INVOICE_HEADER_ID AND
                                    STA.ID = (SELECT MAX(ST1.ID) FROM INVOICE_STATE ST1 WHERE ST1.INVOICE_HEADER_ID = VHD.ID)
                                    INNER JOIN VOUCHER_TYPE ON COD_TIPO_COMPROB = VOUCHER_TYPE.ID
                                    INNER JOIN TARIFARIO_TERMINAL TT ON VHD.CODE = TT.CODE AND VHD.TERMINAL = TT.TERMINAL
                                    INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID AND RATE IS NOT NULL
                                    INNER JOIN TARIFARIO_PRECIO TP ON  TP.TARIFARIO_ID = T.ID AND
                                    TP.FECHA = (SELECT MAX(TP1.FECHA) FROM TARIFARIO_PRECIO TP1 WHERE TP1.TARIFARIO_ID = T.ID AND TP1.FECHA <= VHD.FECHA_EMISION)
                                    WHERE VHD.TERMINAL = :1
                                        ${strWhere}
                              GROUP BY VHD.CODE`;
                        connection.execute(strSql, [this.terminal], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({
                                    status: 'ERROR',
                                    message: err.message,
                                    data: err
                                });
                            } else {

                                var rows = Enumerable.from(data.rows)
                                    .groupBy("$.CODE", null,
                                    function (key, g) {
                                        var r = {
                                            _id: {code: key},
                                            cnt: g.sum("$.CNT"),
                                            total: g.sum("$.TOTAL"),
                                            totalPeso: g.sum("$.TOTAL_TASA"),
                                            totalAgp: g.sum("$.TOTAL_AGP"),
                                            totalPesoAgp: g.sum("$.TOTAL_TASA_AGP")
                                        };
                                        r.cnt = Math.abs(r.cnt);
                                        return r;
                                    }).toArray();

                                resolve({
                                    status: 'OK',
                                    data: rows
                                });
                            }
                        });

                    }
                });
            }
        });
    }

    getPayments (params, options) {
        return new Promise((resolve, reject) => {

            var strSql,
                strWhere = ' AND ',
                skip,
                limit;

            var async = require('async');
            var pool = this.cn.pool;
            var moment = require("moment");

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add getPayments.", new Date());
                        reject(err);
                    } else {

                        if (params.modo === 'preLiquidaciones') {
                            strWhere += `PAYMENT_NUMBER IS NULL AND `;
                            if (params.preNumber) {
                                strWhere += `PAYMENT_PRE_NUMBER = ${params.preNumber} AND `;
                            } else {
                                strWhere += `PAYMENT_PRE_NUMBER IS NOT NULL AND `;
                            }
                        } else if (params.modo === 'liquidaciones') {
                            if (params.number) {
                                strWhere += `PAYMENT_NUMBER = ${params.number} AND `;
                            } else {
                                strWhere += `PAYMENT_NUMBER IS NOT NULL AND `;
                            }
                        }

                        if (params.fechaInicio) {
                            strWhere += `FECHA >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                        }
                        if (params.fechaFin) {
                            strWhere += `FECHA < TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                        }

                        if (strWhere.length > 0) {
                            strWhere = strWhere.substr(0, strWhere.length - 4);
                        }

                        limit = parseInt(options.limit, 10);
                        skip = parseInt(options.skip, 10);

                        strSql = `SELECT *
                                    FROM (
                                          SELECT ID,
                                            TERMINAL,
                                            PAYMENT_PRE_NUMBER,
                                            PAYMENT_NUMBER,
                                            FECHA,
                                            ACCOUNT,
                                            REGISTRADO_EN,
                                            ROW_NUMBER() OVER (ORDER BY FECHA DESC) AS R
                                          FROM PAYMENT
                                          WHERE TERMINAL = :1
                                            ${strWhere}
                                      )
                                    WHERE R BETWEEN :2 AND :3`;
                        connection.execute(strSql, [this.terminal, skip, skip + limit], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject({
                                    status: 'ERROR',
                                    message: err.message,
                                    data: err
                                });
                            } else {

                                var rows = data.rows.map(item => ({
                                    _id: item.ID,
                                    preNumber: item.PAYMENT_PRE_NUMBER,
                                    number: item.PAYMENT_NUMBER,
                                    date: item.FECHA,
                                    terminal: item.TERMINAL,
                                    account: {
                                        user: item.ACCOUNT
                                    }
                                }));

                                resolve({
                                    status: 'OK',
                                    data: rows
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    getPayment (id) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;
            var strSql;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle getPrePayment.", new Date());
                        reject(err);
                    } else {
                        strSql = `SELECT ID,
                                    TERMINAL,
                                    PAYMENT_PRE_NUMBER,
                                    PAYMENT_NUMBER,
                                    FECHA,
                                    ACCOUNT,
                                    REGISTRADO_EN
                                  FROM PAYMENT
                                  WHERE ID = :1`;
                        connection.execute(strSql, [id], {}, (err, payment) => {
                            if (err) {
                                reject({
                                    status: 'ERROR',
                                    message: err.message,
                                    data: err
                                });
                            } else {

                                strSql = `SELECT
                                    PD.CODE,
                                    DESCRIPCION,
                                    CNT,
                                    TOTAL_DOL,
                                    TOTAL_PES
                                  FROM PAYMENT_DETAIL PD
                                    INNER JOIN PAYMENT P ON PD.PAYMENT_ID = P.ID
                                    INNER JOIN TARIFARIO_TERMINAL TT ON TT.CODE = PD.CODE AND
                                                                        TT.TERMINAL = P.TERMINAL
                                    INNER JOIN TARIFARIO T ON TT.TARIFARIO_ID = T.ID
                                  WHERE P.ID = :1`;
                                connection.execute(strSql, [id], {}, (err, details) => {
                                    this.cn.doRelease(connection);
                                    if (err) {
                                        reject({
                                            status: 'ERROR',
                                            message: err.message,
                                            data: err
                                        });
                                    } else {
                                        payment = payment.rows[0];
                                        payment = {
                                            _id: payment.ID,
                                            terminal: payment.TERMINAL,
                                            preNumber: payment.PAYMENT_PRE_NUMBER,
                                            number: payment.PAYMENT_NUMBER,
                                            date: payment.FECHA,
                                            account: payment.ACCOUNT
                                        };
                                        var rows = details.rows.map(item => ({
                                            code: item.CODE,
                                            description: item.DESCRIPCION,
                                            cnt: item.CNT,
                                            totalDol: item.TOTAL_DOL,
                                            totalPes: item.TOTAL_PES
                                        }));

                                        payment.details = rows;

                                        resolve({
                                            status: 'OK',
                                            data: payment
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    setPayment2Invoice(invoiceIds, paymentId) {
        return new Promise((resolve, reject) => {
            var strSql;
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add setPayment2Invoice.", new Date());
                        reject(err);
                    } else {
                        strSql = `UPDATE INVOICE_HEADER
                                    SET PAYMENT_ID = :1
                                  WHERE ID IN (${invoiceIds.join(',').toString()})`;
                        connection.execute(strSql, [paymentId], {autoCommit: true}, (err, result) => {
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
                                    message: `Se agregaron ${result.rowsAffected.toString()} Comprobantes a la preliquidación.`
                                });
                            }
                        });

                    }
                });
            }
        });
    }

    setPayment (params) {
        return new Promise((resolve, reject) => {
            var strSql;
            var pool = this.cn.pool;
            var async = require('async');

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add setPayment", new Date());
                        reject(err);
                    } else {
                        strSql = `UPDATE PAYMENT
                                SET ACCOUNT = :1,
                                    PAYMENT_NUMBER = PAYMENTS_NUMBER_SEQ.NEXTVAL,
                                    FECHA = SYSDATE,
                                    REGISTRADO_EN = SYSDATE
                                WHERE ID = :2`;
                        connection.execute(strSql, [params.user.user, params.preNumber], {autoCommit: false}, (err, paymentUpdated) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {

                                this.getPrePayment({paymentId: params.preNumber})
                                    .then(prePayment => {
                                        let detail,
                                            task,
                                            tasks = [];

                                        prePayment.data.forEach(item => {
                                            task = asyncCallback => {
                                                strSql = `INSERT INTO PAYMENT_DETAIL (
                                                            CODE,
                                                            PAYMENT_ID,
                                                            CNT,
                                                            TOTAL_PES,
                                                            TOTAL_DOL ) VALUES (
                                                            :code,
                                                            :payment_id,
                                                            :cnt,
                                                            :total_pes,
                                                            :total_dol )`;
                                                detail = {
                                                    code: item._id.code,
                                                    payment_id: params.preNumber,
                                                    cnt: item.cnt,
                                                    total_pes: item.totalPeso,
                                                    total_dol: item.total
                                                };
                                                connection.execute(strSql, detail, {autoCommit: false}, (err, detailInserted) => {
                                                    asyncCallback(err, detailInserted);
                                                });
                                            };
                                            tasks.push(task);
                                        });
                                        async.parallel(tasks, (err, data) => {
                                            if (err) {
                                                connection.rollback(() => {
                                                    this.cn.doRelease(connection);
                                                    reject({
                                                        status: "ERROR",
                                                        message: err.message,
                                                        data: err
                                                    });
                                                });
                                            } else {
                                                connection.commit((err, data) => {
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
                                                            message: `Se ha Liquidado la Pre Liquidación #${params.preNumber}`,
                                                            data: params.preNumber
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    })
                                    .catch(err => {
                                        reject({
                                            status: "ERROR",
                                            message: err.message,
                                            data: err
                                        });
                                    });
                            }
                        });
                    }
                });
            }
        });
    }
}

class PayingMongoDB {
    constructor (model, terminal) {
        this.terminal = terminal;
        this.model = model;
        this.Invoice = require("../models/invoice.js");
    }

    addPrePayment (params) {
        return new Promise((resolve, reject) => {
            var moment = require('moment');
            var fecha = params.fecha;

            var param = [{$match: {terminal: this.terminal}}, {$group: {_id: '', max: {$max: '$preNumber'}}}];
            this.model.aggregate(param)
                .exec((err, maxNumber) => {
                    var nextPaymentNumber = 0;
                    if (maxNumber.length > 0) {
                        nextPaymentNumber = maxNumber[0].max;
                    }
                    if (fecha === undefined) {
                        fecha = moment().toDate();
                    }
                    param = {
                        terminal: this.terminal,
                        preNumber: ++nextPaymentNumber,
                        date: fecha,
                        account: params.user._id
                    };
                    this.model.create(param, (err, newPaying) => {
                        if (err) {
                            reject({
                                status: "ERROR",
                                message: err.message,
                                data: err
                            });
                        } else {
                            resolve({status: "OK", data: newPaying});
                        }
                    });
                });
        });
    }

    deletePrePayment (paymentId) {
        return new Promise((resolve, reject) => {
            this.Invoice.update({payment: paymentId}, {$unset: {payment: ''}}, {multi: true}, (err, data) => {
                if (err) {
                    reject({
                        status: 'ERROR',
                        message: err.message,
                        data: err
                    });
                } else {
                    this.model.remove({_id: paymentId}, err => {
                        if (err) {
                            reject({
                                status: 'ERROR',
                                message: err.message,
                                data: err
                            });
                        } else {
                            var msg = `La Liquidación ha sido eliminada y ${data.nModified.toString()} Comprobantes han sido liberados.`;
                            resolve({
                                status: 'OK',
                                message: msg
                            });
                        }
                    });
                }
            });
        });
    }

    getNotPayed (params, options) {
        return new Promise((resolve, reject) => {
            var cond,
                estados,
                tipoDeSuma,
                desde,
                hasta,
                groupByContainer,
                projectByContainer,
                skip, limit, order,
                invoices;

            var priceUtils = require('../include/price.js');
            var mongoose = require("mongoose");
            var moment = require('moment');
            var Enumerable = require('linq');

            var price = new priceUtils.price(this.terminal);

            var VoucherType = require('./voucherType.js');
            VoucherType = new VoucherType();
            VoucherType.getAll({type: -1}, {format: 'JSON'})
            .then(voucherTypes => {
                    cond = voucherTypes.data.map(item => (
                    {$eq: ["$codTipoComprob", item._id]}
                    ));

                    if (options.paginated) {
                        estados = ['R', 'T'];
                        tipoDeSuma = '$detalle.items.impTot';
                    } else {
                        estados = ['R', 'T'];
                        tipoDeSuma = {
                            $cond: { if: {$or: cond},
                                then: {$multiply: ['$detalle.items.impTot', -1]},
                                else: '$detalle.items.impTot'}
                        };
                    }

                    price.ratePrices((err, prices) => {

                        var param,
                            match,
                            rates;

                        rates = prices.map(item => (item.code));

                        if (params._id) {
                            match = {
                                payment: mongoose.Types.ObjectId(params._id)
                            };
                        } else {

                            desde = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
                            hasta = moment(params.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

                            match = {
                                terminal: this.terminal,
                                'fecha.emision': {$gte: desde, $lt: hasta},
                                'detalle.items.id': {$in: rates},
                                'payment': {$exists: false}
                            };

                            if (params.codTipoComprob) {
                                match.codTipoComprob = parseInt(params.codTipoComprob, 10);
                            }
                            if (params.buqueNombre) {
                                match['detalle.buque.nombre'] = params.buqueNombre;
                            }
                            if (params.razonSocial) {
                                match.razon = params.razonSocial;
                            }
                            if (params.contenedor) {
                                match['detalle.contenedor'] = params.contenedor;
                            }
                        }

                        groupByContainer = {
                            _id: '$_id',
                            terminal: '$terminal',
                            nroPtoVenta: '$nroPtoVenta',
                            codTipoComprob: '$codTipoComprob',
                            razon: '$razon',
                            fecha: '$fecha',
                            estado: '$estado',
                            code: '$detalle.items.id',
                            impUnit: '$detalle.items.impUnit',
                            cotiMoneda: '$cotiMoneda',
                            buque: '$detalle.buque.nombre'
                        };
                        projectByContainer = {
                            _id: '$_id._id',
                            terminal: '$_id.terminal',
                            emision: '$_id.fecha',
                            nroPtoVenta: '$_id.nroPtoVenta',
                            codTipoComprob: '$_id.codTipoComprob',
                            buque: '$_id.buque',
                            razon: '$_id.razon',
                            cotiMoneda: '$_id.cotiMoneda',
                            code: '$_id.code',
                            impUnit: '$_id.impUnit',
                            tasa: {$multiply: ['$_id.impUnit', '$cnt']},
                            cnt: '$cnt',
                            cantidad: '$cantidad',
                            estado: '$_id.estado'
                        };

                        if (options.byContainer === '1') {
                            groupByContainer.container = '$detalle.contenedor';
                            groupByContainer.nroComprob = '$nroComprob';
                            projectByContainer.container = '$_id.container';
                            projectByContainer.nroComprob = '$_id.nroComprob';
                        }

                        param = [
                            {$match: match },
                            {$project: {
                                terminal: 1,
                                nroComprob: '$nroComprob',
                                fecha: '$fecha.emision',
                                estado: 1,
                                codTipoComprob: 1,
                                nroPtoVenta: 1,
                                razon: 1,
                                detalle: 1,
                                cotiMoneda: 1
                            }},
                            {$unwind: '$estado'},
                            {$group: {
                                _id:   {
                                    _id: '$_id',
                                    terminal: '$terminal',
                                    fecha: '$fecha',
                                    nroComprob: '$nroComprob',
                                    codTipoComprob: '$codTipoComprob',
                                    nroPtoVenta: '$nroPtoVenta',
                                    razon: '$razon',
                                    detalle: '$detalle',
                                    cotiMoneda: '$cotiMoneda'
                                },
                                estado: {$last: '$estado'}
                            }},
                            {$project: {
                                '_id': '$_id._id',
                                nroPtoVenta: '$_id.nroPtoVenta',
                                nroComprob: '$_id.nroComprob',
                                terminal: '$_id.terminal',
                                fecha: '$_id.fecha',
                                codTipoComprob: '$_id.codTipoComprob',
                                razon: '$_id.razon',
                                detalle: '$_id.detalle',
                                cotiMoneda: '$_id.cotiMoneda',
                                estado: true
                            }},
                            {$match: {'estado.estado': {$nin: estados}}},
                            {$unwind: '$detalle'},
                            {$unwind: '$detalle.items'},
                            {$match: {'detalle.items.id': {$in: rates}}},
                            {$group: {
                                _id: groupByContainer,
                                cnt: {
                                    $sum: {
                                        $cond: { if: {$or: cond},
                                            then: {$multiply: ['$detalle.items.cnt', -1]},
                                            else: '$detalle.items.cnt'}
                                    }
                                },
                                cantidad: {$sum: 1}
                            }},
                            {$project: projectByContainer}
                        ];

                        if (options.order) {
                            order = JSON.parse(options.order);
                            param.push({$sort: order[0]});
                        } else {
                            param.push({$sort: {'fecha.emision': 1}});
                        }

                        if (options.paginated) {
                            limit = parseInt(options.limit, 10);
                            skip = parseInt(options.skip, 10);
                            param.push({$skip: skip});
                            param.push({$limit: limit});
                        }

                        invoices = this.Invoice.aggregate(param);
                        invoices.exec((err, data) => {
                            if (err) {
                                reject({
                                    status: 'ERROR',
                                    message: err.message,
                                    data: err});
                            } else {
                                var response = Enumerable.from(data)
                                    .join(Enumerable.from(prices), '$.code', '$.code', (tasaInvoice, price) => {
                                        var top = Enumerable.from(price.price.topPrices)
                                            .where(itemW => {
                                                if (itemW.from < tasaInvoice.emision) {
                                                    return true;
                                                } else {
                                                    return false;
                                                }
                                            })
                                            .orderByDescending('$.from')
                                            .toArray();

                                        tasaInvoice.impUnitAgp = 0;
                                        if (top.length > 0) {
                                            tasaInvoice.impUnitAgp = top[0].price;
                                        }
                                        tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                        tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                        tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                        tasaInvoice.cnt = Math.abs(tasaInvoice.cnt);
                                        return tasaInvoice;
                                    }).toArray();

                                if (options.paginated) {

                                    param = param.slice(0, param.length-2);
                                    param.push({
                                        $group: {_id: '', cnt: {$sum: 1}}
                                    });
                                    this.Invoice.aggregate(param)
                                        .exec((err, cuenta) => {
                                            if (err) {
                                                reject({
                                                    status: 'ERROR',
                                                    message: err.message,
                                                    data: err
                                                });
                                            } else {
                                                let cnt = 0;
                                                if (cuenta[0]) {
                                                    cnt = cuenta[0].cnt;
                                                }
                                                resolve({status: "OK", totalCount: cnt, data: response});
                                            }
                                        });
                                } else {
                                    resolve({status: "OK", data: response});
                                }
                            }
                        });
                    });

            }).catch(err => {
                reject({
                    status: "ERROR",
                    message: err.message,
                    data: err});
            });
        });
    }

    getPrePayment (params) {
        return new Promise((resolve, reject) => {
            var price,
                cond,
                desde,
                hasta,
                param;

            var Enumerable = require('linq');
            var mongoose = require("mongoose");
            var moment = require('moment');
            var priceUtils = require('../include/price.js');

            var VoucherType = require('./voucherType.js');
            VoucherType = new VoucherType();
            VoucherType.getAll({type: -1}, {format: 'JSON'})
                .then(voucherTypes => {
                    cond = voucherTypes.data.map(item => (
                    {$eq: ["$codTipoComprob", item._id]}
                    ));

                    if (params.paymentId) {
                        param = {
                            payment: mongoose.Types.ObjectId(params.paymentId),
                            terminal: this.terminal
                        };
                    } else {

                        desde = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
                        hasta = moment(params.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();

                        param = {
                            terminal: this.terminal,
                            'fecha.emision': {$gte: desde, $lt: hasta},
                            'payment': {$exists: params.payment}
                        };

                        if (params.codTipoComprob) {
                            param.codTipoComprob = parseInt(params.codTipoComprob, 10);
                        }
                        if (params.buqueNombre) {
                            param['detalle.buque.nombre'] = params.buqueNombre.buqueNombre;
                        }
                        if (params.razon) {
                            param.razon = params.razon;
                        }
                        if (params.contenedor) {
                            param['detalle.contenedor'] = params.contenedor;
                        }
                    }

                    price = new priceUtils.price(this.terminal);
                    price.ratePrices((err, prices) => {
                        var rates;

                        rates = prices.map(item => (item.code));

                        param = [
                            {$match: param},
                            {$project: {
                                terminal: 1,
                                codTipoComprob: 1,
                                nroComprob: 1,
                                payment: 1,
                                fecha: '$fecha.emision',
                                cotiMoneda: 1,
                                detalle: 1,
                                estado: 1
                            }},
                            {$unwind: '$detalle'},
                            {$unwind: '$detalle.items'},
                            {$match: {'detalle.items.id': {$in: rates }}},
                            {"$match":{"estado.estado":{"$nin":["R","T"]}}},
                            {$project: {
                                terminal: 1,
                                code: '$detalle.items.id',
                                nroComprob: 1,
                                cotiMoneda: 1,
                                fecha: 1,
                                payment: 1,
                                cnt: {
                                    $cond: { if: {  $or: cond },
                                        then: {$multiply: ['$detalle.items.cnt', -1]},
                                        else: '$detalle.items.cnt'}
                                },
                                impUnit: '$detalle.items.impUnit'
                            }}
                        ];
                        this.Invoice.aggregate(param)
                        .exec((err, totalPayment) => {
                            var result = Enumerable.from(totalPayment)
                                .join(Enumerable.from(prices), '$.code', '$.code', (tasaInvoice, price) => {

                                    var top = Enumerable.from(price.price.topPrices)
                                        .where((itemW) => {
                                            if (itemW.from < tasaInvoice.fecha) {
                                                return true;
                                            } else {
                                                return false;
                                            }
                                        })
                                        .orderByDescending('$.from')
                                        .toArray();
                                    tasaInvoice.type = price.price._doc.rate;
                                    price.price.topPrices = top[0];
                                    tasaInvoice.impUnitAgp = price.price.topPrices[0].price;
                                    tasaInvoice.tasa = tasaInvoice.impUnit * tasaInvoice.cnt;
                                    tasaInvoice.tasaAgp = tasaInvoice.impUnitAgp * tasaInvoice.cnt;
                                    tasaInvoice.totalTasa = tasaInvoice.tasa * tasaInvoice.cotiMoneda;
                                    tasaInvoice.totalTasaAgp = tasaInvoice.tasaAgp * tasaInvoice.cotiMoneda;
                                    return tasaInvoice;
                                })
                                .groupBy("$.code", null,
                                function (key, g) {
                                    var r = {
                                        _id: {code: key},
                                        cnt: g.sum("$.cnt"),
                                        total: g.sum("$.tasa"),
                                        totalPeso: g.sum("$.totalTasa"),
                                        totalAgp: g.sum("$.tasaAgp"),
                                        totalPesoAgp: g.sum("$.totalTasaAgp")
                                    };
                                    r.cnt = Math.abs(r.cnt);
                                    return r;
                                }).toArray();

                            if (err) {
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err});
                            } else {
                                resolve({
                                    status: "OK",
                                    data: result
                                });
                            }
                        });
                    });

                }).catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err});
                });
        });
    }

    getPayments (params, options) {
        return new Promise((resolve, reject) => {
            var moment = require("moment"),
                fechaInicio,
                fechaFin,
                order;

            var param = {
                terminal: this.terminal
            };

            if (params.modo === 'preLiquidaciones') {
                param.number = {$exists: false};
                if (params.preNumber) {
                    param.preNumber = params.preNumber;
                } else {
                    param.preNumber = {$exists: true};
                }
            } else if (params.modo === 'liquidaciones') {
                if (params.number) {
                    param.number = params.number;
                } else {
                    params.number = {$exists: true};
                }
            }

            fechaInicio = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
            if (params.fechaFin) {
                fechaFin = moment(params.fechaFin, 'YYYY-MM-DD').add(1, 'days').toDate();
            } else {
                fechaFin = moment().add(1, 'days').toDate();
            }

            param.date = {$gte: fechaInicio, $lt: fechaFin};

            //if (options.order) {
            //    order = JSON.parse(options.order);
            //    param.push({$sort: order[0]});
            //} else {
            //    param.push({$sort: {'date': -1}});
            //}

            this.model.find(param)
                .populate('account')
                .sort({date: -1})
                .skip(options.skip)
                .limit(options.limit)
            .exec((err, payings) => {
                if (err) {
                    reject({
                        status: 'ERROR',
                        message: err.message,
                        data: err
                    });
                } else {
                    this.model.count(param, (err, cnt) => {
                        if (err) {
                            reject({
                                status: 'ERROR',
                                message: err.message,
                                data: err
                            });
                        } else {
                            payings = payings.map(item => ({
                                _id: item._id,
                                preNumber: item.preNumber,
                                number: item.number,
                                date: item.date,
                                terminal: item.terminal,
                                detail: item.detail,
                                account: {
                                    user: item.account.user,
                                    group: item.account.group,
                                    role: item.account.role,
                                    terminal: item.account.terminal
                                }
                            }));
                            var result = {
                                status: 'OK',
                                totalCount: cnt,
                                data: payings
                            };
                            resolve(result);
                        }
                    });
                }
            });
        });
    }

    getPayment (id) {
        return new Promise((resolve, reject) => {
            reject({
                status: 'ERROR',
                message: "NOT IMPLEMENTED"
            });
        });
    }
    setPayment2Invoice (invoiceIds, paymentId) {
        return new Promise((resolve, reject) => {
            var async = require('async');
            async.forEach(invoiceIds, (id, asyncCallback) => {
                this.Invoice.update({_id: id},
                    {$set: {
                        'payment': paymentId
                    }}, (err, rowAffected) => {
                        if (err) {
                            asyncCallback(err);
                        } else {
                            asyncCallback();
                        }
                    });
            }, (err, data) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: data
                    });
                } else {
                    resolve({
                        status: "OK",
                        message: `Se agregaron ${invoiceIds.length.toString()} Comprobantes a la preliquidación.`
                    });
                }
            });

        });
    }

    setPayment (params) {
        return new Promise((resolve, reject) => {
            var param = [{$match: {terminal: this.terminal}}, {$group: {_id: '', max: {$max: '$number'}}}];
            this.model.aggregate(param)
            .exec((err, maxNumber) => {
                var nextPaymentNumber = 0;
                if (maxNumber.length > 0) {
                    nextPaymentNumber = (maxNumber[0].max === null) ? 0 : maxNumber[0].max;
                }

                this.model.findOne({terminal: this.terminal, preNumber: params.preNumber}, (err, payment) => {
                    if (err) {
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        if (payment === null || payment === undefined) {
                            reject({
                                status: "ERROR",
                                message: `No se encuentra pre-liquidación #${params.preNumber}`
                            });
                        } else {
                            if (payment.number !== undefined && payment.number !== null) {
                                reject({
                                    status: "ERROR",
                                    message: "La Preliquidación ya se encuentra liquidada",
                                    data: payment
                                });
                            } else {
                                this.getPrePayment({paymentId: payment._id})
                                    .then(prePayment => {
                                        payment.number = ++nextPaymentNumber;
                                        payment.date = Date.now();
                                        payment.account = params.user._id;
                                        payment.detail = prePayment.data.map(item => ({
                                            _id: item._id.code,
                                            cant: item.cnt,
                                            totalDol: item.total,
                                            totalPes: item.totalPeso,
                                            iva: item.totalPeso * 21 / 100,
                                            total: item.totalPeso + (item.totalPeso * 21 / 100)
                                        }));
                                        payment.save((err, paymentSaved) => {
                                            if (err) {
                                                reject({
                                                    status: "ERROR",
                                                    message: err.message,
                                                    data: err
                                                });
                                            } else {
                                                resolve({
                                                    status: "OK",
                                                    message: `Se ha generado la Liquidación # ${nextPaymentNumber}`,
                                                    data: paymentSaved
                                                });
                                            }
                                        });
                                    })
                                    .catch(err => {
                                        reject({
                                            status: "ERROR",
                                            message: err.message,
                                            data: err
                                        });
                                    });
                            }
                        }
                    }
                });
            });
        });
    }
}

/**
 * Representa a un pago.
 * @constructor
 */
class Paying {
    constructor (terminal, connection) {
        if (typeof terminal === 'string') {
            this.terminal = terminal;
        } else if (typeof terminal === 'object') {
            connection = terminal;
        }
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new PayingOracle(this.connection, this.terminal);
            this.db = 'ORACLE';
        } else {
            this.model = require('../models/paying.js');
            this.clase = new PayingMongoDB(this.model, this.terminal);
            this.db = 'MONGODB';
        }
    }

    addPrePayment (params) {
        return this.clase.addPrePayment(params);
    }

    deletePrePayment (paymentId) {
        return this.clase.deletePrePayment(paymentId);
    }

    getNotPayed (params, options = {paginated: false}) {
        return this.clase.getNotPayed(params, options);
    }

    getPrePayment (params) {
        return this.clase.getPrePayment(params);
    }

    getPayments (params, options) {
        return this.clase.getPayments(params, options);
    }

    getPayment (id) {
        return this.clase.getPayment(id);
    }

    setPayment2Invoice (invoiceIds, paymentId) {
        return this.clase.setPayment2Invoice(invoiceIds, paymentId);
    }

    setPayment (params) {
        return this.clase.setPayment(params);
    }
}

module.exports = Paying;
