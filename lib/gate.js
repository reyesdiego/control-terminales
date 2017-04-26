/**
 * Created by diego on 10/26/15.
 */
"use strict";

var Constantes = require('./constantes.js');


class GateOracle {
    constructor (connection) {
        this.cn = connection;
    }

    getGates (params) {
        return new Promise((resolve, reject) => {
            var strSql,
                strWhere = '';
            var pool = this.cn.pool;
            var async = require("async");
            var moment = require("moment");
            var taskAsync;
            var tasksAsync = [];
            var skip,
                limit,
                orderBy;

            if (pool) {

                skip = parseInt(params.skip, 10);
                limit = parseInt(params.limit, 10);
                orderBy = this.cn.orderBy(params.order);
                //orderBy = "gates.ID ASC"; //TODO arreglar tema de orderby

                if (params.terminal || params.buque || params.viaje || params.contenedor || params.carga || params.tren || params.patenteCamion || params.fechaInicio || params.fechaFin || params.size) {
                    strWhere += " WHERE ";
                }

                if (params.terminal) {
                    strWhere += ` TERMINAL = '${params.terminal}' AND `;
                }

                if (params.buque) {
                    strWhere += ` BUQUE = '${params.buque}' AND `;
                }

                if (params.viaje) {
                    strWhere += ` VIAJE = '${params.viaje}' AND `;
                }

                if (params.contenedor) {
                    strWhere += ` CONTENEDOR = '${params.contenedor}' AND `;
                }

                if (params.carga) {
                    strWhere += ` CARGA = '${params.carga}' AND `;
                }

                if (params.tren) {
                    if (params.tren['$exists']) {
                        strWhere += ` TREN is not null AND `;
                    } else {
                        strWhere += ` TREN = '${params.tren}' AND `;
                    }
                }

                if (params.patenteCamion) {
                    strWhere += ` PATENTECAMION = '${params.patenteCamion}' AND `;
                }

                if (params.size) {
                    strWhere += ` LARGO = ${params.size} AND `;
                }

                if (params.ontime === '1') {
                    strWhere += " gates.TURNOINICIO <= gates.GATETIMESTAMP AND gates.TURNOFIN >= gates.GATETIMESTAMP AND ";
                }

                if (params.ontime === '0') {
                    strWhere += " ( gates.TURNOINICIO > gates.GATETIMESTAMP OR gates.TURNOFIN < gates.GATETIMESTAMP ) AND ";
                }

                if (params.fechaInicio || params.fechaFin) {
                    if (params.fechaInicio) {
                        strWhere += ` GATETIMESTAMP >= TO_TIMESTAMP('${moment(params.fechaInicio).format('YYYY-MM-DD HH:mm:ss')}', 'RRRR-MM-DD HH24:Mi:ss') AND `;
                    }
                    if (params.fechaFin) {
                        strWhere += ` GATETIMESTAMP <= TO_TIMESTAMP('${moment(params.fechaFin).format('YYYY-MM-DD HH:mm:ss')}', 'RRRR-MM-DD HH24:Mi:ss') AND `;
                    }
                }
                strWhere = strWhere.substr(0, strWhere.length - 4);

                pool.getConnection((err, connection) => {
                    let result;
                    if (err) {
                        console.log("%s, Error en Oracle getGates.", new Date());
                        this.cn.doRelease(connection);
                        result = {
                            status: "ERROR",
                            message: err.message,
                            data: err
                        };
                        reject(result);
                    } else {
                        taskAsync = asyncCallback => {
                            strSql = `SELECT *
                                    FROM
                                    (SELECT ROW_NUMBER() Over (Order By ${orderBy} ) R,
                                        ID,
                                        TERMINAL,
                                        BUQUE,
                                        VIAJE,
                                        CONTENEDOR,
                                        CARGA,
                                        MOV,
                                        TIPO,
                                        GATETIMESTAMP,
                                        TURNOINICIO,
                                        TURNOFIN,
                                        PATENTECAMION,
                                        TREN,
                                        LARGO
                                    FROM gates
                                     ${strWhere} )
                                    WHERE  R BETWEEN :1 AND :2`;

                            connection.execute(strSql, [skip, skip + limit], {}, (err, data) => {
                                if (err) {
                                    asyncCallback(err);
                                } else {
                                    data = data.rows.map(item => (
                                    {
                                        _id: item.ID,
                                        terminal: item.TERMINAL,
                                        contenedor: item.CONTENEDOR,
                                        buque: item.BUQUE,
                                        viaje: item.VIAJE,
                                        gateTimestamp: item.GATETIMESTAMP,
                                        turnoInicio: item.TURNOINICIO,
                                        turnoFin: item.TURNOFIN,
                                        carga: item.CARGA,
                                        tipo: item.TIPO,
                                        mov: item.MOV,
                                        patenteCamion: item.PATENTECAMION,
                                        tren: item.TREN,
                                        largo: item.LARGO
                                    }
                                    ));
                                    asyncCallback(undefined, data);
                                }
                            });
                        };
                        tasksAsync.push(taskAsync);

                        taskAsync = asyncCallback => {
                            strSql = `SELECT count(*) cnt from gates ${strWhere}`;

                            connection.execute(strSql, [], {}, (err, data) => {
                                if (err) {
                                    asyncCallback(err);
                                } else {
                                    asyncCallback(undefined, data.rows[0]);
                                }
                            });
                        };
                        tasksAsync.push(taskAsync);

                        async.parallel(tasksAsync, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                result = {
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                };
                                reject(result);
                            } else {
                                let total = data[1].CNT;
                                result = {
                                    status: "OK",
                                    totalCount: total,
                                    pageCount: (limit > total) ? total : limit,
                                    data: data[0]
                                };
                                resolve(result);
                            }
                        });
                    }
                });
            }
        });
    }

    getByHour (params) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED - Moved to micro-statistic"
            });

/*
            var self = this;
            var strSql;
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getShipTrips.", new Date());
                        reject({
                            status: `ERROR`,
                            message: err.message,
                            data: err
                        });
                    } else {
                        strSql = "select terminal, to_number(to_char(gatetimestamp, 'HH24')) hora,  count(*) cnt " +
                            "from gates " +
                            "where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND " +
                            "gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd') " +
                            "group by terminal, to_char(gatetimestamp, 'HH24') ";
                        connection.execute(strSql,[params.fechaInicio, params.fechaFin], {}, (err, data) => {
                            self.cn.doRelease(connection);
                            if (err) {
                                reject({
                                    status: `ERROR`,
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                resolve({
                                    status: `OK`,
                                    data: data.rows.map((item) => ({
                                        terminal: item.TERMINAL,
                                        hour: item.HORA,
                                        cnt: item.CNT
                                    }))
                                });
                            }
                        });
                    }
                });
            }
*/
        });
    }

    getByMonth (params) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED - Moved to micro-statistic"
            });
            /*
            var moment = require("moment");
            var strSql;
            var result;
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getShipTrips.", new Date());
                        result = {
                            status: 'ERROR',
                            message: err.message
                        };
                        reject(result);
                    } else {
                        let inicio = moment(params.fechaInicio).format("YYYY-MM-DD");
                        let fin = moment(params.fechaFin).format("YYYY-MM-DD");
                        strSql = "select terminal, to_number(to_char(gatetimestamp, 'YYYY')) year, to_number(to_char(gatetimestamp, 'MM')) mes,  to_number(to_char(gatetimestamp, 'YYYYMM')) DIA, count(*) cnt " +
                            "from gates " +
                            "where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND " +
                            "gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd') " +
                            "group by terminal, to_char(gatetimestamp, 'YYYY'), to_char(gatetimestamp, 'MM'), to_char(gatetimestamp, 'YYYYMM') " +
                            "ORDER BY DIA, TERMINAL";
                        connection.execute(strSql,[inicio, fin], {}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                result = {
                                    status: 'ERROR',
                                    message: err.message
                                };
                                reject(result);
                            } else {
                                result = {
                                    status: `OK`,
                                    data: data.rows.map(item => (
                                    {
                                        terminal: item.TERMINAL,
                                        year: item.YEAR,
                                        month: item.MES,
                                        cnt: item.CNT
                                    }))
                                };
                                resolve(result);
                            }
                        });
                    }
                });
            }*/
        });
    }

    getDistinct (params) {
        return new Promise((resolve, reject) => {
            var strSql;
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        reject(err);
                    } else {
                        strSql = `select distinct ${params.distinct} from gates where terminal = :1 and ${params.distinct} is not null order by ${params.distinct}`;
                        connection.execute(strSql, [params.terminal], {outFormat: this.cn.oracledb.ARRAY}, (err, data) => {
                            this.cn.doRelease(connection);
                            if (err) {
                                reject(err);
                            } else {
                                let result = data.rows.map((item) => (item[0]));
                                resolve(result);
                            }
                        });
                    }
                });
            }
        });
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
                        strSql = `SELECT MAX(REGISTRADO_EN) REGISTRADO_EN
                                    FROM GATES WHERE TERMINAL = :1`;
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

    getMissingGates(params) {
        return new Promise((resolve, reject) => {
            var strSql;
            var async = require('async');
            var pool = this.cn.pool;
            var strWhere = '';
            var moment = require("moment");

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getMissingGates.", new Date());
                        reject(err);
                    } else {
                        let tasks = [];
                        let task = asyncCallback => {

                            if (params.fechaInicio) {
                                strWhere += ` FECHA_EMISION >= TO_DATE('${moment(params.fechaInicio, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }
                            if (params.fechaFin) {
                                strWhere += ` FECHA_EMISION <= TO_DATE('${moment(params.fechaFin, 'YYYY-MM-DD').format('YYYY-MM-DD')}', 'RRRR-MM-DD') AND `;
                            }

                            strSql = `SELECT CONTENEDOR,
                                        FECHA_EMISION
                                FROM (
                                        SELECT
                                            ROW_NUMBER() Over (Order By FECHA_EMISION DESC) R,
                                            CONTENEDOR,
                                            FECHA_EMISION
                                        FROM INVOICE_DETAIL INVD
                                        INNER JOIN INVOICE_HEADER INVH ON INVD.INVOICE_HEADER_ID = INVH.ID
                                        WHERE ${strWhere}
                                               TERMINAL = :1 AND
                                               CODE IN (SELECT TT.CODE
                                                       FROM TARIFARIO_TERMINAL TT
                                                           INNER JOIN TARIFARIO T ON TT.TARIFARIO_ID = T.ID
                                                       WHERE TT.TERMINAL = INVH.TERMINAL AND RATE IS NOT NULL ) AND
                                           NOT EXISTS (SELECT *
                                                FROM GATES G
                                               WHERE CARGA = 'LL' AND
                                                   G.CONTENEDOR = INVD.CONTENEDOR AND
                                                   G.TERMINAL = INVH.TERMINAL )
                                        GROUP BY CONTENEDOR, FECHA_EMISION
                                        ORDER BY FECHA_EMISION DESC
                                    )
                                WHERE R BETWEEN :2 AND :3`;
                            connection.execute(strSql, [params.terminal, params.skip, params.skip + params.limit], {}, (err, data) => {
                                if (err) {
                                    asyncCallback(err);
                                } else {
                                    asyncCallback(undefined, data.rows);
                                }
                            });
                        };
                        tasks.push(task);

                        task = asyncCallback => {
                            strSql = `select max(R) as R
                                    from (
                                      SELECT ROW_NUMBER() Over (Order By FECHA_EMISION DESC) as R
                                        FROM INVOICE_DETAIL INVD
                                        INNER JOIN INVOICE_HEADER INVH ON INVD.INVOICE_HEADER_ID = INVH.ID
                                        WHERE ${strWhere}
                                              TERMINAL = :1 AND
                                              CODE IN (SELECT TT.CODE
                                                       FROM TARIFARIO_TERMINAL TT
                                                           INNER JOIN TARIFARIO T ON TT.TARIFARIO_ID = T.ID
                                                       WHERE TT.TERMINAL = INVH.TERMINAL AND RATE IS NOT NULL ) AND
                                           NOT EXISTS (SELECT *
                                                FROM GATES G
                                               WHERE CARGA = 'LL' AND
                                                   G.CONTENEDOR = INVD.CONTENEDOR AND
                                                   G.TERMINAL = INVH.TERMINAL )
                                        GROUP BY CONTENEDOR, FECHA_EMISION
                                    )`;

                            connection.execute(strSql, [params.terminal], {}, (err, data) => {
                                if (err) {
                                    asyncCallback(err);
                                } else {
                                    asyncCallback(undefined, data.rows);
                                }
                            });
                        };
                        tasks.push(task);

                        async.parallel(tasks, (err, data) => {
                            var result;
                            if (err) {
                                result = {
                                    status: 'ERROR',
                                    message: err.message,
                                    data: err
                                };
                                this.cn.doRelease(connection);
                                reject(result);
                            } else {
                                let rows = data[0];
                                let count = data[1];

                                if (rows) {
                                    rows = rows.map(item => {
                                        return {contenedor: item.CONTENEDOR, fecha: item.FECHA_EMISION};
                                    });
                                }
                                result = {
                                    status: 'OK',
                                    totalCount: count[0].R,
                                    data: rows
                                };
                                this.cn.doRelease(connection);
                                resolve(result);
                            }
                        });
                    }
                });
            }
        });
    }

    getMissingInvoices(params) {
        return new Promise((resolve, reject) => {
            var self = this;
            var strSql;
            var result = [];
            var pool = this.cn.pool;

            if (pool) {

                var fetchRowsFromRS = (connection, resultSet, numRows) => {

                    resultSet.getRows( numRows, (err, rows) => {
                        if (err) {
                            self.cn.doRelease(connection);
                            reject({
                                status: "ERROR",
                                message: err.message,
                                data: err
                            });
                        } else if (rows.length === 0) {  // no rows, or no more rows
                            self.cn.doRelease(connection);
                            result = {
                                status: "OK",
                                totalCount: result.length,
                                data: result
                            };
                            resolve(result);

                        } else if (rows.length > 0) {
                            rows.forEach(item => {
                                result.push({
                                    terminal: item.TERMINAL,
                                    buque: item.BUQUE,
                                    viaje: item.VIAJE,
                                    contenedor: item.CONTENEDOR,
                                    gateTimestamp: item.GATETIMESTAMP,
                                    turnoInicio: item.TURNOINICIO,
                                    turnoFin: item.TURNOFIN,
                                    carga: item.CARGA,
                                    mov: item.MOV,
                                    tipo: item.TIPO,
                                    patenteCamion: item.PATENTECAMION,
                                    largo: item.LARGO
                                });
                            });
                            fetchRowsFromRS(connection, resultSet, numRows);  // get next set of rows
                        }
                    });
                };

                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle getMissingGates.", new Date());
                        reject({status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        strSql = `SELECT *
                                 FROM GATES G
                                 WHERE  CARGA = 'LL' AND
                                        NOT EXISTS (
                                            SELECT *
                                            FROM INVOICE_DETAIL INVD
                                                INNER JOIN INVOICE_HEADER INVH ON INVD.INVOICE_HEADER_ID = INVH.ID
                                                WHERE G.CONTENEDOR = INVD.CONTENEDOR AND
                                                        G.TERMINAL = INVH.TERMINAL AND
                                                        INVD.CODE IN (SELECT TT.CODE
                                                                       FROM TARIFARIO_TERMINAL TT
                                                                            INNER JOIN TARIFARIO T ON TT.TARIFARIO_ID = T.ID
                                                                    WHERE TT.TERMINAL = INVH.TERMINAL AND RATE IS NOT NULL )
                                        ) AND
                                        TERMINAL = :1`;

                        connection.execute(strSql,[params.terminal], {resultSet: true}, (err, data) => {

                            if (err) {
                                self.cn.doRelease(connection);
                                reject({status: "ERROR", message: err.message, data: err});
                            } else {
                                fetchRowsFromRS(connection, data.resultSet, 100);
                            }
                        });
                    }
                });
            }
        });
    }

    add (gate) {
        return new Promise((resolve, reject) => {
            var strSql,
                values;
            var pool = this.cn.pool;
            var moment = require("moment");

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add Gate.", new Date());
                        reject(err);
                    } else {
                        strSql = `insert into GATES
                                    (ID,
                                    TERMINAL,
                                    BUQUE,
                                    VIAJE,
                                    CONTENEDOR,
                                    CARGA,
                                    MOV,
                                    TIPO,
                                    GATETIMESTAMP,
                                    TURNOINICIO,
                                    TURNOFIN,
                                    PATENTECAMION,
                                    TREN,
                                    REGISTRADO_EN,
                                    LARGO,
                                    ISO) VALUES (
                                    gates_seq.nextval,
                                     :terminal, :buque, :viaje, :contenedor, :carga, :mov, :tipo, to_date(:gateTimestamp, 'YYYY-MM-DD HH24:MI:SS'), to_date(:turnoInicio, 'YYYY-MM-DD HH24:MI:SS'), to_date(:turnoFin, 'YYYY-MM-DD HH24:MI:SS'),
                                    :patenteCamion, :tren, to_date(:registrado_en, 'YYYY-MM-DD HH24:MI:SS'), :largo, :iso ) RETURNING ID INTO :outputId`;
                        values = {
                            outputId : {type: this.cn.oracledb.NUMBER, dir: this.cn.oracledb.BIND_OUT},
                            terminal: gate.terminal,
                            buque: gate.buque,
                            viaje: gate.viaje,
                            contenedor: gate.contenedor,
                            carga: gate.carga,
                            mov: gate.mov,
                            tipo: gate.tipo,
                            gateTimestamp: moment(gate.gateTimestamp).format("YYYY-MM-DD HH:mm:ss"),
                            turnoInicio: (gate.turnoInicio === null || gate.turnoInicio === '') ? null : moment(gate.turnoInicio).format("YYYY-MM-DD HH:mm:ss"),
                            turnoFin: (gate.turnoFin === null || gate.turnoFin === '') ? null : moment(gate.turnoFin).format("YYYY-MM-DD HH:mm:ss"),
                            patenteCamion: gate.patenteCamion,
                            tren: gate.tren,
                            registrado_en: moment().format("YYYY-MM-DD HH:mm:ss"),
                            largo: gate.size,
                            iso: gate.iso
                        };
                        connection.execute(strSql, values, {autoCommit: true}, (err, result) => {
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
                                response.data._id = result.outBinds.outputId[0];

                                resolve(response);
                            }
                        });
                    }
                });
            }
        });
    }

    toString() {
        return "Gate class on Oracle 11g";
    }

}

class GateMongoDB {
    constructor (model) {
        this.model = model;
        this.invoice = require("../models/invoice.js");
    }

    getGates(params) {
        return new Promise((resolve, reject) => {
            var Gate = this.model;
            var async = require('async');
            var tasksAsync = [],
                taskAsync,
                skip = params.skip,
                limit = params.limit,
                order=params.order;

            delete params.skip;
            delete params.limit;
            delete params.order;
            delete params.fechaInicio;
            delete params.fechaFin;
            delete params.ontime;

            taskAsync = asyncCallback => {
                let gates = Gate.find(params, {__v: 0}).limit(limit).skip(skip);
                if (order) {
                    order = JSON.parse(order);
                    gates.sort(order[0]);
                } else {
                    gates.sort({gateTimestamp: -1});
                }
                gates.lean();
                gates.exec((err, data) => {
                    if (err) {
                        asyncCallback(err);
                    } else {
                        asyncCallback(undefined, data);
                    }
                });
            };
            tasksAsync.push(taskAsync);

            taskAsync = asyncCallback => {
                Gate.count(params, (err, cnt) => {
                    asyncCallback(undefined, cnt);
                });
            };
            tasksAsync.push(taskAsync);

            async.parallel(tasksAsync, (err, results) => {
                let result;
                if (err) {
                    result = {
                        status: 'ERROR',
                        data: err
                    };
                    reject(result);
                } else {
                    let pageCount = results[0].length;
                    result = {
                        status: 'OK',
                        pageCount: (limit > pageCount) ? pageCount : limit,
                        page: skip,
                        totalCount: results[1],
                        data: results[0]
                    };
                    resolve(result);
                }
            });
        });
    }

    getByHour(params) {
        return new Promise((resolve, reject) => {

            var moment = require('moment'),
                jsonParam;
            params.fechaInicio = moment(params.fechaInicio, ['YYYY-MM-DD']).toDate();
            params.fechaFin = moment(params.fechaFin, ['YYYY-MM-DD']).add(1, 'days').toDate();

            jsonParam = [
                {$match: {
                    gateTimestamp: {$gte: params.fechaInicio, $lt: params.fechaFin},
                    carga: "LL"
                }},
                { $project: {
                    gateTimestamp : {$subtract: [ '$gateTimestamp', 180 * 60 * 1000]},
                    terminal: '$terminal'
                }},
                { $group : {
                    _id : {
                        terminal: '$terminal',
                        hour: { $hour : "$gateTimestamp" }
                    },
                    cnt : { $sum : 1 }
                }},
                { $project: {
                    terminal: '$_id.terminal',
                    hour: '$_id.hour',
                    cnt: true
                }},
                { $sort: {'hour': 1, 'terminal': 1 }}
            ];

            this.model.aggregate(jsonParam, (err, data) => {
                if (err) {
                    reject({
                        status: `ERROR`,
                        message: err.message,
                        data: err
                    });
                } else {
                    resolve({
                        status: `OK`,
                        data: data
                    });
                }
            });
        });
    }

    getByMonth(params) {
        return new Promise((resolve, reject) => {
            var moment = require('moment'),
                jsonParam;

            jsonParam = [
                {$match: {
                    gateTimestamp: {$gte: params.fechaInicio, $lt: params.fechaFin},
                    carga: 'LL'
                }},
                { $project : {
                    terminal: '$terminal',
                    gateTimestamp : {$subtract: [ '$gateTimestamp', 180 * 60 * 1000]},
                    dia: {$dateToString: { format: "%Y%m", date: {$subtract: [ '$gateTimestamp', 180 * 60 * 1000]} }}
                }},
                {"$group": {
                    _id: {
                        terminal: "$terminal",
                        year: {$year: "$gateTimestamp"},
                        month: {$month: "$gateTimestamp"},
                        dia: '$dia'
                    },
                    cnt: {"$sum": 1}
                }},
                { $project: {
                    terminal: '$_id.terminal',
                    year: '$_id.year',
                    month: '$_id.month',
                    dia: '$_id.dia',
                    cnt: true
                }},
                { $sort: {'dia': 1, 'terminal': 1 }}
            ];

            this.model.aggregate(jsonParam, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    getDistinct(params) {
        return new Promise((resolve, reject) => {
            var jsonParam;
            jsonParam = {
                terminal: params.terminal
            };
            this.model.distinct(params.distinct, jsonParam, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    getLastInsert (terminal, lastHours) {
        return new Promise((resolve, reject) => {

            this.model.find({terminal: terminal})
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

    getMissingGates(params) {
        return new Promise((resolve, reject) => {
            var Gate = this.model,
                Invoice = this.invoice;
            var _price,
                _rates,
                taskAsync,
                tasksAsync = [],
                linq = require("linq"),
                async = require("async"),
                moment = require("moment");

            _price = require('../lib/price.js');
            _rates = new _price(params.terminal);
            _rates.rates((err, rates) => {

                taskAsync = asyncCallback => {
                    var invoicesWo;
                    var fechaBactssa = moment("2014-08-01", 'YYYY-MM-DD').toDate();
                    var invoices = Invoice.aggregate([
                        {$match: {
                            terminal: params.terminal,
                            codTipoComprob: 1,
                            'detalle.items.id': {$in: rates},
                            'fecha.emision': {$gte: fechaBactssa}
                        }},
                        {$project: {detalle: 1, fecha: '$fecha.emision'}},
                        {$unwind: '$detalle'},
                        {$unwind: '$detalle.items'},
                        {$match: {'detalle.items.id': {$in: rates}}},
                        {$project: {
                            _id: false,
                            //v: '$nroPtoVenta',
                            //n: '$nroComprob',
                            c: '$detalle.contenedor',
                            //i: '$detalle.items.id',
                            f: '$fecha'
                        }},
                        {$sort: {fecha: -1}}
                    ]);

                    //if (req.query.order) {
                    //    order = JSON.parse(req.query.order);
                    //    invoices.sort(order[0]);
                    //} else {
                    //    invoices.sort({codTipoComprob: 1, nroComprob: 1});
                    //}
                    invoices.exec((err, dataInvoices) => {
                        if (err) {
                            asyncCallback(err);
                        } else {
                            invoicesWo = linq.from(dataInvoices).toArray();
                            asyncCallback(undefined, invoicesWo);
                        }
                    });
                };
                tasksAsync.push(taskAsync);

                taskAsync = asyncCallback => {
                    let gatesWo;
                    let gates;
                    gates = Gate.find({terminal: params.terminal, carga: "LL"}, {contenedor: true, _id: false});
                    gates.exec((err, dataGates) => {
                        if (err) {
                            asyncCallback(err);
                        } else {
                            gatesWo = linq.from(dataGates).select("{c: $.contenedor}").toArray();
                            asyncCallback(undefined, gatesWo);
                        }
                    });
                }
                tasksAsync.push(taskAsync);

                async.parallel(tasksAsync, (err, data) => {
                    var invoicesWo = data[0],
                        gatesWo = data[1],
                        invoicesWoGates;

                    if (err) {
                        reject({
                                status: 'ERROR',
                                data: err
                            });
                    } else {

                        invoicesWo = linq.from(invoicesWo);
                        gatesWo = linq.from(gatesWo);
                        invoicesWoGates = invoicesWo.except(gatesWo, "$.c").toArray();
                        //.except(dataGates).toArray();

                        resolve({
                            status: 'OK',
                            totalCount: invoicesWoGates.length,
                            data: invoicesWoGates
                        });
                    }
                });
            });
        });
    }

    getMissingInvoices(params) {
        return new Promise((resolve, reject) => {
            var Gate = this.model;
            var usr = req.usr,
                terminal = '',
                _price,
                _rates,
                gates,
                taskAsync,
                tasksAsync = [];

            if (usr.role === 'agp') {
                terminal = req.params.terminal;
            } else {
                terminal = usr.terminal;
            }

            _price = require('../include/price.js');
            _rates = new _price.price();
            _rates.rates(function (err, rates) {
                let invoicesWo,
                    gatesWo;
                log.time("missingInvoices");

                taskAsync = function (asyncCallback) {
                    log.time("gatesTime");
                    gates = Gate.find({terminal: terminal, carga: "LL"});

                    //if (req.query.order) {
                    //    var order = JSON.parse(req.query.order);
                    //    gates.sort(order[0]);
                    //} else {
                    //    gates.sort({gateTimestamp: 1});
                    //}
                    gates.lean();
                    gates.exec((err, dataGates) => {
                        log.timeEnd("gatesTime");
                        if (err) {
                            reject({status: 'ERROR', data: err.message});
                        } else {

                            if (err) {
                                reject({status: 'ERROR', data: err.message});
                            } else {
                                gatesWo = linq.from(dataGates);
                                asyncCallback();
                            }
                        }
                    });
                };
                tasksAsync.push(taskAsync);

                taskAsync = (asyncCallback) => {

                    let invoices = this.invoice.aggregate([
                        {$match: {terminal: terminal}},
                        {$unwind: '$detalle'},
                        {$unwind: '$detalle.items'},
                        {$match: {'detalle.items.id': {$in: rates}}},
                        {$project: { c: '$detalle.contenedor'}}
                    ]);

                    invoices.exec((err, dataInvoices) => {
                        log.timeEnd("invoicesTime");
                        if (err) {
                            reject({status: 'ERROR', data: err.message});
                        } else {
                            invoicesWo = linq.from(dataInvoices).select(function (item) { return { contenedor: item.c };});
                            asyncCallback();
                        }
                    });
                };
                tasksAsync.push(taskAsync);

                async.parallel(tasksAsync, (err, data) => {
                    let gatesWoGates;

                    gatesWoGates = gatesWo.except(invoicesWo, "$.contenedor").toArray();

                    resolve({
                            status: 'OK',
                            totalCount: gatesWoGates.length,
                            data: gatesWoGates
                    });
                });
            });
        });
    }

    add (gate) {
        return new Promise((resolve, reject) => {
            var gate2insert = gate;
            var result;

            gate2insert.largo = gate2insert.size;
            delete gate2insert.size;

            if (gate2insert) {
                this.model.insert(gate2insert, (errSave, gateNew) => {
                    if (errSave) {
                        result = {
                            status: `ERROR`,
                            message: errSave.message
                        };
                        reject(result);
                    } else {
                        result = {
                            status: `OK`,
                            data: gateNew
                        };
                        resolve(result);
                    }
                });
            }
        });

    }

    toString() {
        return "Gate class on MongoDB";
    }
}

/**
 * Representa un Gate.
 * @constructor
 * @param {object} connection - Objeto de conexion a la base de datos a implementar.
 */
class Gate extends Constantes {
    constructor(connection) {
        super();

        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new GateOracle(this.connection);
        } else {
            this.connection = require('../models/gate.js');
            this.clase = new GateMongoDB(this.connection);
        }
    }

    validate (object) {
        var util = require('util');
        var errors;
        var Validr = require('../include/validation.js');

        var validate = new Validr.validation(object, {
            isContainer: function (container) {
                return /\D{4}\d{7}/.test(container);
            },
            isLicensePlate: function (license) {
                return /\D{3}\d{3}/.test(license);
            }
        });

        //validate
        //    .validate('buque', 'buque is required.')
        //    .isLength(1)
        //validate
        //    .validate('viaje', 'viaje is required.')
        //    .isLength(1);
        validate
            .validate('mov', {
                isLength: 'mov is required.',
                isIn: 'mov must be in "IMPO" or "EXPO" or "PASO" values.'
            })
            .isLength(1)
            .isIn(['EXPO', 'IMPO', 'PASO']);
        validate
            .validate('tipo', {
                isLength: 'tipo is required.',
                isIn: 'tipo must be in "IN" or "OUT" values.'
            })
            .isLength(1)
            .isIn(['IN', 'OUT']);
        validate
            .validate('carga', {
                isLength: 'carga is required.',
                isIn: 'carga must be in "VA" or "LL" or "NO" values.'
            })
            .isLength(1)
            .isIn(['VA', 'NO', 'LL']);
        //validate
        //    .validate('patenteCamion', 'patenteCamion is invalid.', {ignoreEmpty: true})
        //    .isLength(1, 6, 6)
        //    .isLicensePlate();
        validate
            .validate('gateTimestamp', {
                isLength: 'gateTimestamp is required.',
                isDate: 'gateTimestamp must be a valid date'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('turnoInicio', 'turnoInicio must be a valid date', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('turnoFin', 'turnoFin must be a valid date', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('contenedor', 'Contenedor is invalid', {ignoreEmpty: true})
            .isContainer();

        errors = validate.validationErrors();
        if (errors) {
            return {
                status: "ERROR",
                message: "Error en la validacion del Gate",
                data: util.inspect(errors)
            };
        } else {
            return {status: 'OK'};
        }
    }

    getGates (params) {
        return this.clase.getGates(params);
    }

    /**
     * Obtiene un JSON con el listado de Gates agrupados por hora
     *
     * @param {Object} params - Objeto Filtro.
     * @param {date} params.fechaInicio - Fecha inicial de Emision
     * @param {date} params.fechaFin - Fecha final de Emision.
     * @api public
     */
    getByHour (params) {
        return this.clase.getByHour(params);
    }

    /**
     * Obtiene un JSON con el listado de Gates agrupados por mes
     *
     * @param {Object} params - Objeto Filtro.
     * @param {date} params.fechaInicio - Fecha inicial de Emision
     * @param {date} params.fechaFin - Fecha final de Emision.
     * @param {Object} callback - Funcion de Retorno
     * @api public
     */
    getByMonth (params) {
        var moment = require("moment");

        var fechaInicio = moment(params.fechaInicio, "YYYY-MM-DD");
        params.fechaInicio = moment([fechaInicio.year(), fechaInicio.month(), 1]).toDate();

        var fechaFin = moment(params.fechaFin, "YYYY-MM-DD");
        params.fechaFin = moment([fechaFin.year(), fechaFin.month(), 1]).add(1, 'month').toDate();

        return this.clase.getByMonth(params);
    }

    /**
     * Obtiene un JSON con el listado del Distinct de la propiedad pasada por parámetro
     *
     * @param {Object} params - Objeto Filtro.
     * @param {string} params.terminal - Terminal.
     * @param {string} params.distinct - Nombre del campo a hacer distinct.
     * @api public
     */
    getDistinct (params) {
        return this.clase.getDistinct(params);
    }

    getLastInsert (terminal, lastHours) {
        return this.clase.getLastInsert(terminal, lastHours);
    }

    getMissingGates (params) {
        return this.clase.getMissingGates(params);
    }

    /**
     * Obtiene un JSON con el listado de Gates agrupados por hora
     *
     * @param {Object} params - Objeto Filtro.
     * @param {date} params.fechaInicio - Fecha inicial de Emision
     * @param {date} params.fechaFin - Fecha final de Emision.
     * @return {Object}
     * @api public
     */
    getMissingInvoices(params) {
        return this.clase.getMissingInvoices(params);
    }

    add (newGate, options) {

        var validate = {},
            trimBody;
        /** mantengo al parametro newGate como si fuere pasado por valor. */
        newGate = JSON.parse(JSON.stringify(newGate));

        if (typeof options === 'object') {
            if (options.trim) {
                trimBody = require('trim-body');
                trimBody(newGate);
            }
            if (options.validate) {
                validate = this.validate(newGate);
            }
        }
        if (validate.status === 'ERROR') {
            return new Promise((resolve, reject) => {
                reject(validate);
            });
        } else {
            return this.clase.add(newGate);
        }
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }
}

module.exports = Gate;