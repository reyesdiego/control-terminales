/**
 * Created by diego on 2/15/16.
 */
"use strict";

class PriceOracle {
    constructor(connection, terminal) {
        this.terminal = terminal;
        this.cn = connection;
    }

    add(params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var async = require("async");
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        reject({ status: "ERROR", message: "Error en Oracle add Price", data: err });
                    } else {
                        var strSql = `INSERT INTO TARIFARIO (
                                    ID,
                                    TERMINAL,
                                    TIPO,
                                    CODE,
                                    DESCRIPCION,
                                    UNIDAD,
                                    LARGO,
                                    AUD_TIME,
                                    AUD_USER) VALUES (
                                    TARIFARIO_SEQ.nextval,
                                    :terminal,
                                    :code,
                                    :descripcion,
                                    :unidad,
                                    :largo,
                                    systimestamp,
                                    '${params.usr.user}') RETURNING ID INTO :outputId`;
                        var param = {
                            outputId: { type: this.cn.oracledb.NUMBER, dir: this.cn.oracledb.BIND_OUT },
                            terminal: params.terminal,
                            tipo: params.terminal,
                            code: params.code.toUpperCase(),
                            descripcion: params.description,
                            unidad: params.unit,
                            largo: params.largo
                        };

                        connection.execute(strSql, param, { autoCommit: false }, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({ status: "ERROR", message: err.message, data: err });
                            } else {
                                let idNew = data.outBinds.outputId[0];
                                let tasks = [];
                                let task;
                                params.topPrices.forEach(topPrice => {
                                    task = (asyncCallbackPrice) => {
                                        strSql = `INSERT INTO TARIFARIO_PRECIO (
                                            ID,
                                            TARIFARIO_ID,
                                            FECHA,
                                            PRECIO,
                                            MONEDA) VALUES (
                                            TARIFARIO_SEQ.nextval,
                                            :tarifario_id,
                                            TO_DATE(:fecha, 'YYYY-MM-DD'),
                                            :price,
                                            :moneda)`;
                                        var param = {
                                            tarifario_id: idNew,
                                            fecha: moment(topPrice.from).format("YYYY-MM-DD"),
                                            price: topPrice.price,
                                            moneda: topPrice.currency
                                        };
                                        connection.execute(strSql, param, { autoCommit: false }, (err, data) => {
                                            if (err) {
                                                asyncCallbackPrice({ status: "ERROR", message: err.message, data: err });
                                            } else {
                                                asyncCallbackPrice(undefined, data);
                                            }
                                        });
                                    };
                                    tasks.push(task);
                                });

                                if (params.matches && params.matches.match && params.matches.match.length > 0) {
                                    params.matches.match.forEach(match => {
                                        task = (asyncCallbackMatch) => {
                                            strSql = `INSERT INTO TARIFARIO_TERMINAL (
                                            ID,
                                            TARIFARIO_ID,
                                            TERMINAL,
                                            CODE,
                                            AUD_TIME,
                                            AUD_USER) VALUES (
                                            TARIFARIO_SEQ.nextval,
                                            :tarifario_id,
                                            :terminal,
                                            :code,
                                            SYSDATE,
                                            :aud_date)`;
                                            var param = {
                                                tarifario_id: idNew,
                                                terminal: params.terminal,
                                                code: match.code,
                                                aud_date: params.usr.user
                                            };
                                            connection.execute(strSql, param, { autoCommit: false }, (err, data) => {
                                                if (err) {
                                                    asyncCallbackMatch({ status: "ERROR", message: err.message, data: err });
                                                } else {
                                                    asyncCallbackMatch(undefined, data);
                                                }
                                            });
                                        };
                                        tasks.push(task);
                                    });
                                }

                                async.parallel(tasks, (err, data) => {
                                    if (err) {
                                        connection.rollback(() => {
                                            this.cn.doRelease(connection);
                                            reject({
                                                status: "ERROR",
                                                message: err.message,
                                                data: this.cn.error(err)
                                            });
                                        });
                                    } else {
                                        connection.commit((err, data) => {
                                            this.cn.doRelease(connection);
                                            this.getPrice(idNew)
                                                .then(data => {
                                                    resolve(data);
                                                })
                                                .catch(err => {
                                                    reject(err);
                                                });
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

    delete(id) {
        return new Promise((resolve, reject) => {
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        reject({ status: "ERROR", message: "Error en Oracle update Price", data: err });
                    } else {
                        var strSql = "DELETE FROM TARIFARIO_PRECIO WHERE TARIFARIO_ID = :1";
                        connection.execute(strSql, [id], { autoCommit: false }, (err, data) => {
                            if (err) {
                                connection.rollback(errRollback => {
                                    this.cn.doRelease(connection);
                                    reject({
                                        status: "ERROR",
                                        data: this.cn.error(err)
                                    });
                                });
                            } else {
                                strSql = "DELETE FROM TARIFARIO_TERMINAL WHERE TARIFARIO_ID = :1";
                                connection.execute(strSql, [id], { autoCommit: false }, (err, data) => {
                                    if (err) {
                                        connection.rollback(errRollback => {
                                            this.cn.doRelease(connection);
                                            reject({
                                                status: "ERROR",
                                                data: this.cn.error(err)
                                            });
                                        });
                                    } else {
                                        strSql = "DELETE FROM TARIFARIO WHERE ID = :1";
                                        connection.execute(strSql, [id], { autoCommit: false }, (err, data) => {
                                            connection.commit(err => {
                                                this.cn.doRelease(connection);
                                                resolve({
                                                    status: "OK",
                                                    data: { _id: id }
                                                });
                                            });
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

    update(params) {
        return new Promise((resolve, reject) => {
            var async = require("async");
            var moment = require("moment");
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        reject({ status: "ERROR", message: "Error en Oracle update Price", data: err });
                    } else {
                        var updateSet = " SET ";
                        if (params.description !== undefined ||
                            params.code !== undefined ||
                            params.largo !== undefined ||
                            params.norma !== undefined ||
                            params.unit !== undefined) {

                            var paramValues = {
                                ID: params._id
                            };

                            updateSet += ` AUD_TIME = systimestamp, AUD_USER = '${params.usr.user}',`;
                            if (params.description !== undefined) {
                                updateSet += " DESCRIPCION = :description,";
                                paramValues.description = params.description;
                            }
                            if (params.unit !== undefined) {
                                updateSet += " UNIDAD = :unit,";
                                paramValues.unit = params.unit;
                            }
                            if (params.norma !== undefined) {
                                updateSet += " NORMA = :norma,";
                                paramValues.norma = params.norma;
                            }
                            if (params.largo !== undefined) {
                                updateSet += " LARGO = :largo,";
                                paramValues.largo = params.largo;
                            }
                            if (params.code !== undefined) {
                                updateSet += " CODE = :code,";
                                paramValues.code = params.code;
                            }
                            updateSet = updateSet.substr(0, updateSet.length - 1);

                            var strSql = "UPDATE TARIFARIO " + updateSet;
                            strSql += " WHERE ID = :ID";

                            connection.execute(strSql, paramValues, { autoCommit: false }, (err, data) => {
                                if (err) {
                                    this.cn.doRelease(connection);
                                    reject({ status: "ERROR", message: err.message, data: err });
                                } else {
                                    /** Solo elimina los marcados para eliminar **/
                                    let Enumerable = require("linq");
                                    let strIn = "";
                                    let ids = Enumerable.from(params.matches.match)
                                        .where(x => x.delete)
                                        .select(z => z.id)
                                        .toArray()
                                        .join(",");
                                    ids = ids.substr(0, ids.length);
                                    if (ids !== "") {
                                        strIn = `; DELETE FROM TARIFARIO_TERMINAL WHERE TARIFARIO_ID = :1  AND TERMINAL = '${params.matches.terminal}' AND ID IN (${ids})`;
                                    }
                                    var strSql = `BEGIN
                                                        DELETE FROM TARIFARIO_PRECIO WHERE TARIFARIO_ID = :1
                                                        ${strIn};
                                                  END;`;
                                    connection.execute(strSql, [params._id], { autoCommit: false }, (err, data) => {
                                        if (err) {
                                            this.cn.doRelease(connection);
                                            reject({ status: "ERROR", message: err.message, data: err });
                                        } else {

                                            let tasks = [];
                                            let task;
                                            params.topPrices.forEach(topPrice => {
                                                task = (asyncCallbackPrice) => {
                                                    strSql = `INSERT INTO TARIFARIO_PRECIO (
                                                                ID,
                                                                TARIFARIO_ID,
                                                                FECHA,
                                                                PRECIO,
                                                                MONEDA) VALUES (
                                                                TARIFARIO_SEQ.nextval,
                                                                :tarifario_id,
                                                                TO_DATE(:fecha, 'YYYY-MM-DD'),
                                                                :price,
                                                                :moneda)`;
                                                    var param = {
                                                        tarifario_id: params._id,
                                                        fecha: moment(topPrice.from).format("YYYY-MM-DD"),
                                                        price: parseFloat(topPrice.price),
                                                        moneda: topPrice.currency
                                                    };
                                                    connection.execute(strSql, param, { autoCommit: false }, (err, data) => {
                                                        if (err) {
                                                            asyncCallbackPrice({ status: "ERROR", message: err.message, data: err });
                                                        } else {
                                                            asyncCallbackPrice(undefined, param);
                                                        }
                                                    });
                                                };
                                                tasks.push(task);
                                            });

                                            if (params.matches && params.matches.match && params.matches.match.length > 0) {
                                                params.matches.match.forEach(match => {
                                                    /** Solo da de alta los nuevos **/
                                                    task = (asyncCallbackMatch) => {
                                                        let param;
                                                        if (match.id === undefined) {
                                                            strSql = `INSERT INTO TARIFARIO_TERMINAL (
                                                                ID,
                                                                TARIFARIO_ID,
                                                                TERMINAL,
                                                                CODE,
                                                                AUD_TIME,
                                                                AUD_USER,
                                                                APPROVED_BY) VALUES (
                                                                TARIFARIO_SEQ.nextval,
                                                                :tarifario_id,
                                                                :terminal,
                                                                :code,
                                                                SYSDATE,
                                                                :aud_user,
                                                                :approvedBy)`;
                                                            param = {
                                                                tarifario_id: params._id,
                                                                terminal: params.matches.terminal,
                                                                code: match.code,
                                                                aud_user: params.usr.user,
                                                                approvedBy: (match.status) ? params.usr.user : null
                                                            };
                                                        } else {
                                                            strSql = `UPDATE TARIFARIO_TERMINAL
                                                                        SET APPROVED_BY = :approvedBy
                                                                        WHERE ID = :id`;
                                                            param = {
                                                                approvedBy: (match.status) ? params.usr.user : null,
                                                                id: match.id
                                                            };
                                                        }
                                                        connection.execute(strSql, param, { autoCommit: false }, (err, data) => {
                                                            if (err) {
                                                                asyncCallbackMatch({ status: "ERROR", message: err.message, data: err });
                                                            } else {
                                                                asyncCallbackMatch(undefined, param);
                                                            }
                                                        });
                                                    };
                                                    tasks.push(task);
                                                });
                                            }

                                            async.parallel(tasks, (err, dataAsync) => {
                                                if (err) {
                                                    connection.rollback(() => {
                                                        this.cn.doRelease(connection);
                                                        reject({
                                                            status: "ERROR",
                                                            message: JSON.stringify(err),
                                                            data: this.cn.error(err)
                                                        });
                                                    });
                                                } else {
                                                    connection.commit((err, data) => {
                                                        this.cn.doRelease(connection);
                                                        this.getPrice(params._id)
                                                            .then(data => {
                                                                data.data.matches.match = data.data.matches.match.map(item => {
                                                                    if (Enumerable.from(dataAsync).contains(item.code, "$.code")) {
                                                                        item.new = true;
                                                                    }
                                                                    return item;
                                                                });
                                                                resolve(data);
                                                            })
                                                            .catch(err => {
                                                                reject(err);
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
                });
            }
        });
    }

    addHeader(params) {
        return new Promise((resolve, reject) => {
            var strSql,
                values;
            var pool = this.cn.pool;

            var tarifario_header = params;
            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add Tarifario Header.", new Date());
                        reject(err);
                    } else {
                        strSql = `INSERT INTO TARIFARIO_HEADER
                                    (ID,
                                    DESCRIPTION,
                                    MOV) VALUES (
                                    TARIFARIO_SEQ.NEXTVAL,
                                     :description, :mov) RETURNING ID INTO :outputId`;
                        values = {
                            outputId: { type: this.cn.oracledb.NUMBER, dir: this.cn.oracledb.BIND_OUT },
                            description: tarifario_header.description,
                            mov: tarifario_header.mov
                        };
                        connection.execute(strSql, values, { autoCommit: true }, (err, result) => {
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
                                    status: "OK",
                                    data: {
                                        _id: result.outBinds.outputId[0]
                                    }
                                };

                                resolve(response);
                            }
                        });
                    }
                });
            }
        });

    }

    addGroup(params) {
        return new Promise((resolve, reject) => {
            var strSql,
                values;
            var tasks = [];
            var async = require("async");
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        this.cn.doRelease(connection);
                        console.log("%s, Error en Oracle add Tarifario Group.", new Date());
                        reject(err);
                    } else {
                        strSql = "DELETE TARIFARIO_GROUP WHERE TARIFARIO_HEADER_ID = :1";
                        connection.execute(strSql, [params.tarifario_header_id], { autoCommit: false }, (err, data) => {
                            tasks = params.tarifario_id.map(tarifario_id => (callbackAsync => {
                                strSql = `INSERT INTO TARIFARIO_GROUP
                                    (ID,
                                    TARIFARIO_ID,
                                    TARIFARIO_HEADER_ID) VALUES (
                                    TARIFARIO_SEQ.NEXTVAL,
                                     :tarifario_id, :tarifario_header_id) RETURNING ID INTO :outputId`;
                                values = {
                                    outputId: { type: this.cn.oracledb.NUMBER, dir: this.cn.oracledb.BIND_OUT },
                                    tarifario_id: tarifario_id,
                                    tarifario_header_id: params.tarifario_header_id
                                };
                                connection.execute(strSql, values, { autoCommit: false }, (err, result) => {
                                    if (err) {
                                        callbackAsync(err);
                                    } else {
                                        delete values.outputId;
                                        callbackAsync(undefined, result.outBinds.outputId[0]);
                                    }
                                });
                            }));

                            async.parallel(tasks, (err, data) => {
                                connection.commit(err => {
                                    this.cn.doRelease(connection);
                                    var response = {
                                        status: "OK",
                                        data: data
                                    };
                                    resolve(response);
                                });
                            });

                        });
                    }
                });
            }
        });
    }

    getHeaders() {
        return new Promise((resolve, reject) => {
            var self = this;
            var pool = self.cn.pool;
            var strSql,
                result;
            var util = require("util");


            if (pool) {
                strSql = `SELECT *
                            FROM TARIFARIO_HEADER TH
                            ORDER BY TH.DESCRIPTION`;

                pool.getConnection((err, connection) => {
                    connection.execute(strSql, [], {}, (err, data) => {
                        self.cn.doRelease(connection);
                        if (err) {
                            result = {
                                status: "ERROR",
                                message: err.message,
                                data: err
                            };
                            reject(result);
                        } else {
                            result = {
                                status: "OK",
                                totalCount: 0,
                                data: []
                            };
                            if (data.rows) {
                                result.totalCount = data.rows.length;
                                result.data = data.rows.map(item => ({
                                    _id: item.ID,
                                    description: item.DESCRIPTION,
                                    mov: item.MOV
                                }));
                            }
                            resolve(result);
                        }
                    });
                });
            }
        });
    }

    getHeadersGroups(tarifario_header_id) {
        return new Promise((resolve, reject) => {
            var self = this;
            var pool = self.cn.pool;
            var strSql,
                result;
            var linq = require("linq");


            if (pool) {
                strSql = `SELECT TG.TARIFARIO_HEADER_ID, TG.TARIFARIO_ID, TH.DESCRIPTION DESCRIPTION_H, T.CODE, T.DESCRIPCION DESCRIPTION_T
                            FROM TARIFARIO_GROUP TG
                                INNER JOIN TARIFARIO_HEADER TH ON TG.TARIFARIO_HEADER_ID = TH.ID
                                INNER JOIN TARIFARIO T ON TG.TARIFARIO_ID = T.ID
                            WHERE TG.TARIFARIO_HEADER_ID = :1`;
                pool.getConnection((err, connection) => {
                    connection.execute(strSql, [tarifario_header_id], {}, (err, data) => {
                        self.cn.doRelease(connection);
                        if (err) {
                            result = {
                                status: "ERROR",
                                message: err.message,
                                data: err
                            };
                            reject(result);
                        } else {
                            result = {
                                status: "OK",
                                data: []
                            };
                            if (data.rows) {
                                var grupo = linq.from(data.rows)
                                    .groupBy("$.TARIFARIO_HEADER_ID", null, (key, g) => {
                                        return {
                                            tarifario_header_id: key,
                                            tarifario: g.getSource().map(item => ({
                                                description: item.DESCRIPTION_T,
                                                code: item.CODE,
                                                id: item.TARIFARIO_ID
                                            }))
                                        };
                                    }).toArray();

                                result.data = grupo;
                            }
                            resolve(result);
                        }
                    });
                });
            }
        });
    }

    getPrice(id) {
        return new Promise((resolve, reject) => {
            var self = this;
            var pool = self.cn.pool;
            var strSql,
                result;
            var util = require("util");

            if (pool) {
                pool.getConnection((err, connection) => {
                    strSql = `SELECT T.ID, T.TIPO AS TERMINAL, CODE, DESCRIPCION, UNIDAD, RATE, FECHA, PRECIO, MONEDA, LARGO, NORMA, MOV, TIPO
                                FROM TARIFARIO T
                                        INNER JOIN TARIFARIO_PRECIO TP ON T.ID = TP.TARIFARIO_ID
                                WHERE T.ID = :1 AND
                                    (TIPO = :2 OR TIPO = 'AGP')
                                ORDER BY FECHA, TP.ID`;
                    //(TERMINAL = :2 OR TERMINAL = 'AGP')

                    connection.execute(strSql, [id, self.terminal], {}, (err, price) => {
                        if (err) {
                            self.cn.doRelease(connection);
                            result = {
                                status: "ERROR",
                                message: err.message,
                                data: err
                            };
                            reject(result);
                        } else {
                            result = {
                                status: "OK",
                                data: {}
                            };
                            if (price.rows.length > 0) {

                                strSql = `SELECT ID, TERMINAL, CODE, APPROVED_BY
                                    FROM TARIFARIO_TERMINAL T
                                    WHERE T.TARIFARIO_ID = :1 AND
                                           TERMINAL = :2`;

                                connection.execute(strSql, [id, self.terminal], {}, (err, matchPrices) => {
                                    self.cn.doRelease(connection);
                                    if (err) {
                                        result = {
                                            status: "ERROR",
                                            message: err.message,
                                            data: err
                                        };
                                        reject(result);
                                    } else {
                                        let item = price.rows[0];
                                        let topPrices,
                                            matches = { terminal: self.terminal, match: [] };

                                        topPrices = price.rows.map(top => ({
                                            from: top.FECHA,
                                            price: top.PRECIO,
                                            currency: top.MONEDA
                                        }));

                                        matches.match = matchPrices.rows.map(item => ({
                                            id: item.ID,
                                            code: item.CODE,
                                            status: (item.APPROVED_BY) ? true : false,
                                            approvedBy: item.APPROVED_BY
                                        }));

                                        result.data = {
                                            _id: item.ID,
                                            terminal: item.TERMINAL,
                                            description: item.DESCRIPCION,
                                            code: item.CODE,
                                            rate: item.RATE,
                                            unit: item.UNIDAD,
                                            topPrices: topPrices,
                                            matches: matches,
                                            largo: item.LARGO,
                                            norma: item.NORMA,
                                            mov: item.MOV,
                                            tipo: item.TIPO
                                        };
                                        resolve(result);
                                    }
                                });
                            } else {
                                resolve(result);
                            }
                        }
                    });
                });
            }
        });
    }

    getPrices(params) {
        return new Promise((resolve, reject) => {
            var self = this;
            var pool = self.cn.pool;
            var strSql,
                strWhere = " AND ",
                result;
            var util = require("util");


            if (pool) {
                strSql = `SELECT TPP.PRECIO, TPP.MONEDA, T.CODE, T.DESCRIPCION, T.ID, T.TIPO AS TERMINAL, TP.FECHA, T.UNIDAD, T.RATE, T.LARGO, T.NORMA, T.MOV, T.TIPO
                         FROM TARIFARIO T
                            left join  (select TARIFARIO_ID, max(fecha) fecha    from TARIFARIO_PRECIO group by TARIFARIO_ID) TP on T.ID = TP.TARIFARIO_ID
                            left join tarifario_precio tpp on tpp.tarifario_id = tp.tarifario_id AND tpp.fecha = tp.fecha
                         WHERE T.TERMINAL = :1 %s
                         ORDER BY T.TERMINAL, T.CODE`;
                //"WHERE (T.TERMINAL = :1 OR T.TERMINAL = 'AGP') %s " +

                if (params.onlyRates) {
                    strWhere += " RATE IS NOT NULL AND ";
                }
                if (params.code) {
                    strWhere += util.format(" T.CODE = '%s' AND ", params.code);
                }

                strWhere = strWhere.substr(0, strWhere.length - 4);
                strSql = util.format(strSql, strWhere);

                pool.getConnection((err, connection) => {
                    connection.execute(strSql, [self.terminal], {}, (err, data) => {
                        self.cn.doRelease(connection);
                        if (err) {
                            result = {
                                status: "ERROR",
                                message: err.message,
                                data: err
                            };
                            reject(result);
                        } else {
                            result = {
                                status: "OK",
                                totalCount: 0,
                                data: []
                            };
                            if (data.rows) {
                                result.totalCount = data.rows.length;
                                result.data = data.rows.map(item => (
                                    {
                                        _id: item.ID,
                                        terminal: item.TERMINAL,
                                        code: item.CODE,
                                        description: item.DESCRIPCION,
                                        unit: item.UNIDAD,
                                        rate: item.RATE,
                                        largo: item.LARGO,
                                        norma: item.NORMA,
                                        mov: item.MOV,
                                        tipo: item.TIPO,
                                        topPrices: [{
                                            from: item.FECHA,
                                            price: item.PRECIO,
                                            currency: item.MONEDA
                                        }]
                                    }));
                            }
                            resolve(result);
                        }
                    });
                });
            }
        });
    }

    getRates(callback) {
        var self = this;
        var pool = self.cn.pool;
        var strSql,
            result;
        var util = require("util");

        if (pool) {
            strSql = `SELECT ID,
                            TIPO AS TERMINAL,
                            CODE,
                            DESCRIPCION,
                            UNIDAD,
                            RATE,
                            MOV,
                            TIPO
                      FROM TARIFARIO
                      WHERE RATE IS NOT NULL
                      ORDER BY RATE, CODE`;
            pool.getConnection((err, connection) => {
                connection.execute(strSql, [], {}, (err, data) => {
                    self.cn.doRelease(connection);
                    if (err) {
                        result = {
                            status: "ERROR",
                            message: err.message,
                            data: err
                        };
                        if (callback) return callback(result);
                    } else {
                        result = {
                            status: "OK",
                            totalCount: 0,
                            data: null
                        };
                        if (data.rows) {
                            result.totalCount = data.rows.length;
                            result.data = data.rows.map(item => ({
                                _id: item.ID,
                                terminal: item.TERMINAL,
                                description: item.DESCRIPCION,
                                code: item.CODE,
                                rate: item.RATE,
                                unit: item.UNIDAD,
                                mov: item.MOV,
                                tipo: item.TIPO
                            }));
                        }
                        if (callback) return callback(undefined, result);
                    }
                });
            });
        }
    }

    rates(parametro, callback) {
        var self = this;
        var strSql,
            strWhere = "",
            result;
        var util = require("util");
        var pool = this.cn.pool;

        if (pool) {

            strSql = "SELECT TT.CODE, DESCRIPCION " +
                "from TARIFARIO T" +
                "   inner join TARIFARIO_TERMINAL TT ON  T.ID = TT.TARIFARIO_ID " +
                "WHERE RATE is not null AND %s";
            if (self.terminal) {
                strWhere += util.format(" TT.TERMINAL = '%s' AND ", self.terminal);
            }

            strSql = util.format(strSql, strWhere);
            strSql = strSql.substr(0, strSql.length - 4);

            pool.getConnection(function (err, connection) {
                connection.execute(strSql, [], { outFormat: self.cn.oracledb.ARRAY }, function (err, data) {
                    self.cn.doRelease(connection);
                    if (err) {
                        if (callback !== undefined) return callback(err);
                    } else {
                        if (parametro.description) {
                            let g = {};
                            data.rows.map(function (item) {
                                g[item[0]] = item[1];
                            });
                            result = g;
                        } else {
                            result = data.rows.map(function (item) {
                                return item[0];
                            });
                        }
                        if (callback !== undefined) return callback(undefined, result);
                    }
                });
            });

        }
    }

    ratePrices(fecha, callback) {
        var self = this;
        var strSql,
            strWhere = "";
        var util = require("util");
        var pool = this.cn.pool;

        if (pool) {

            strSql = `SELECT T.DESCRIPCION, T.ID, T.MOV, TT.TERMINAL, TP.FECHA, T.UNIDAD, T.RATE, TT.CODE, TP.PRECIO, TP.MONEDA
                        FROM TARIFARIO T
                           INNER JOIN TARIFARIO_PRECIO TP ON T.ID = TP.TARIFARIO_ID
                           INNER JOIN TARIFARIO_TERMINAL TT ON T.ID = TT.TARIFARIO_ID,
                            (SELECT TARIFARIO_ID, max(fecha) fecha
                             FROM TARIFARIO_PRECIO
                             WHERE FECHA <= TO_DATE(:1, 'RRRR-MM-DD')
                             GROUP BY TARIFARIO_ID) TPP
                        WHERE T.RATE IS NOT NULL AND
                              T.ID = TP.TARIFARIO_ID AND
                              TP.TARIFARIO_ID = TPP.TARIFARIO_ID AND
                              TP.FECHA = TPP.FECHA AND %s`;

            if (self.terminal) {
                strWhere += util.format(" TT.TERMINAL = '%s' AND ", self.terminal);
            }

            strWhere = strWhere.substr(0, strWhere.length - 4);
            strSql = util.format(strSql, strWhere);

            pool.getConnection((err, connection) => {
                connection.execute(strSql, [fecha], {}, (err, data) => {
                    self.cn.doRelease(connection);
                    if (err) {
                        if (callback !== undefined) return callback(err);
                    } else {
                        let map;
                        map = data.rows.map(item => ({
                            code: item.CODE,
                            price: {
                                _id: item.ID,
                                terminal: item.TERMINAL,
                                description: item.DESCRIPCION,
                                rate: item.RATE,
                                mov: item.MOV,
                                topPrices: [{
                                    from: item.FECHA,
                                    price: item.PRECIO,
                                    currency: item.MONEDA
                                }]
                            }
                        }));
                        if (callback !== undefined) return callback(undefined, map);
                    }
                });
            });
        }
    }

    toString() {
        return "Price class on Oracle 11g";
    }
}

class PriceMongoDB {
    constructor(model, terminal) {
        this.terminal = terminal;
        this.model = model;
        this.matchPrice = require("../models/matchPrice.js");
    }

    add(params) {
        return new Promise((resolve, reject) => {
            var _price = new this.model({
                terminal: params.terminal,
                tipo: params.terminal,
                code: params.code.toUpperCase(),
                description: params.description,
                unit: params.unit,
                topPrices: params.topPrices,
                matches: []
            });
            _price.save((errSave, priceAdded) => {
                if (errSave) {
                    reject({ status: "ERROR", message: errSave.message, data: errSave });
                } else {
                    if (params.matches && params.matches.match && params.matches.match.length > 0) {
                        let matchPrice2Add = new this.matchPrice({
                            terminal: params.matches.terminal,
                            code: params.matches.code,
                            match: params.matches.match.map(item => (item.code)),
                            price: priceAdded._id
                        });
                        matchPrice2Add.save((err, matchPriceAdded) => {
                            if (err) {
                                reject({ status: "ERROR", message: err.message, data: err });
                            } else {
                                priceAdded.matches.push(matchPriceAdded._id);
                                priceAdded.save((err) => {
                                    if (err) {
                                        reject({ status: "ERROR", message: err.message, data: err });
                                    } else {
                                        resolve({ status: "OK", data: priceAdded });
                                    }
                                });
                            }
                        });
                    }
                }
            });
        });
    }

    update(params) {
        return new Promise((resolve, reject) => {
            this.model.findOne({ _id: params._id })
                .populate({ path: "matches", match: { terminal: this.terminal }, select: "match" })
                .exec((err, price2Upd) => {
                    if (err) {
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        if (price2Upd) {
                            price2Upd.description = params.description;
                            price2Upd.code = params.code;
                            price2Upd.largo = params.largo;
                            price2Upd.norma = params.norma;
                            price2Upd.topPrices = params.topPrices;
                            price2Upd.unit = params.unit;
                            price2Upd.save((errSave) => {
                                if (errSave) {
                                    reject({
                                        status: "ERROR",
                                        message: errSave.message,
                                        data: errSave
                                    });
                                } else {
                                    let Enumerable = require("linq");
                                    if (price2Upd.matches && price2Upd.matches.length > 0) {
                                        this.matchPrice.findOne({ _id: price2Upd.matches[0]._id })
                                            .exec((err, data) => {
                                                data.match = Enumerable.from(params.matches.match).where(x => !x.delete).select(x => x.code).toArray();
                                                data.save((errSave, data) => {
                                                    if (errSave) {
                                                        reject({
                                                            status: "OK",
                                                            message: errSave.message,
                                                            data: errSave
                                                        });
                                                    } else {
                                                        resolve({
                                                            status: "OK",
                                                            data: data
                                                        });
                                                    }
                                                });
                                            });
                                    } else {
                                        var newMatch = new this.matchPrice({
                                            terminal: params.usr.terminal,
                                            price: price2Upd._id,
                                            code: params.code,
                                            match: Enumerable.from(params.matches.match).where(x => !x.delete).select(x => x.code).toArray()
                                        });
                                        newMatch.save((errSave, data) => {
                                            if (errSave) {
                                                reject({
                                                    status: "ERROR",
                                                    message: errSave.message,
                                                    data: errSave
                                                });
                                            } else {
                                                price2Upd.matches.push(data._id);
                                                price2Upd.save((err, priceNew) => {
                                                    resolve({
                                                        status: "OK",
                                                        data: data
                                                    });
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            resolve({ status: "OK", data: {} });
                        }
                    }
                });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            this.model.remove({ _id: id }, err => {
                if (err) {
                    reject({ status: "ERROR", data: err.message });
                } else {
                    this.matchPrice.remove({ price: id }, err => {
                        if (err) {
                            reject({ status: "ERROR", data: err.message });
                        } else {
                            resolve({ status: "OK", data: { id: id } });
                        }
                    });
                }
            });
        });
    }

    getHeaders() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getHeadersGroups() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getPrice(id) {
        return new Promise((resolve, reject) => {
            var price = this.model;
            var param,
                result;

            param = {
                _id: id,
                $or: [
                    { terminal: "AGP" },
                    { terminal: this.terminal }
                ]
            };

            price.findOne(param)
                .populate({ path: "matches", match: { terminal: this.terminal }, select: "terminal match" })
                .exec((err, price) => {
                    if (err) {
                        reject({ status: "ERROR", message: err.message, data: err });
                    } else {
                        result = {
                            status: "OK",
                            totalCount: 0,
                            data: null
                        };
                        if (price) {
                            result.totalCount = 1;
                            result.data = price;
                        }
                        resolve(result);
                    }
                });
        });
    }

    getPrices(params) {
        return new Promise((resolve, reject) => {
            var price = this.model;
            var param = {};

            if (params !== undefined) {
                param["$or"] = [
                    { terminal: "AGP" },
                    { terminal: this.terminal }
                ];
            }
            if (params.code) {
                param.code = params.code;
            }
            if (params.onlyRates) {
                param.rate = { $exists: true };
            }

            price.find(param, { topPrices: { $slice: -1 } })
                .sort({ terminal: 1, code: 1 })
                .exec((err, priceList) => {
                    if (err) {
                        reject({ status: "ERROR", data: err.message });
                    } else {
                        resolve({
                            status: "OK",
                            totalCount: priceList.length,
                            data: priceList
                        });
                    }
                });
        });
    }

    getRates(callback) {
        var param = {
            terminal: "AGP",
            rate: { $ne: null }
        };

        this.model.find(param)
            .sort({ rate: 1, code: 1 })
            .exec(function (err, priceList) {
                if (err) {
                    callback({ status: "ERROR", message: err.message });
                } else {
                    let result = {
                        status: "OK",
                        totalCount: priceList.length,
                        data: priceList
                    };
                    callback(undefined, result);
                }
            });
    }

    rates(parametro, callback) {
        var Enumerable = require("linq"),
            selfMatchPrice,
            params = [],
            self = this;

        if (typeof parametro === "function") {
            callback = parametro;
            parametro.description = false;
        }

        if (callback !== undefined) {
            selfMatchPrice = this.matchPrice;

            if (self.terminal !== undefined) {
                params.push({ $match: { terminal: self.terminal } });
            } else {
                params.push({ $match: { terminal: { $exists: true } } });
            }

            params.push({ $project: { match: 1, price: 1 } });
            params.push({ $unwind: "$match" });
            selfMatchPrice.aggregate(params, function (err, data) {
                selfMatchPrice.populate(data, [{ path: "price", match: { rate: { $exists: true } }, select: "_id terminal description unit rate topPrices" }], function (err, matchprices) {
                    var ratesDesc = {},
                        result,
                        a;

                    if (err) {
                        if (typeof callback === "function")
                            return callback(err);
                    } else {
                        result = Enumerable.from(matchprices)
                            .where(function (item) {
                                return item.price !== null;
                            }).toArray();

                        if (parametro.description) {
                            a = Enumerable.from(result).select(function (item) {
                                ratesDesc[item.match] = item.price.description;
                                return item;
                            }).toArray();
                            result = ratesDesc;
                        } else if (parametro.description !== undefined && parametro.description === false) {
                            result = Enumerable.from(result).select(function (item) {
                                return item.match;
                            }).toArray();
                        } else if (parametro.fecha) {
                            a = Enumerable.from(result).select(function (item) {
                                var top = Enumerable.from(item.price.topPrices)
                                    .where(function (itemW) {
                                        if (itemW.from < parametro.fecha) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    })
                                    .orderByDescending("$.from")
                                    .toArray();
                                item.price.topPrices = top;

                                ratesDesc = {
                                    code: item.match,
                                    price: item.price
                                };
                                return ratesDesc;
                            }).toArray();
                            result = a;
                        }
                        if (typeof callback === "function")
                            return callback(undefined, result);
                    }
                });
            });
        }
    }

    toString() {
        return "Price class on MongoDB";
    }

}

class Price {
    constructor(terminal, connection) {
        if (typeof terminal === "string") {
            this.terminal = terminal;
        } else if (typeof terminal === "object") {
            connection = terminal;
        }
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new PriceOracle(this.connection, this.terminal);
            this.db = "ORACLE";
        } else {
            this.connection = require("../models/price.js");
            this.clase = new PriceMongoDB(this.connection, this.terminal);
            this.db = "MONGODB";
        }
    }

    add(params) {
        return this.clase.add(params);
    }

    update(params) {
        return this.clase.update(params);
    }

    delete(id) {
        return this.clase.delete(id);
    }

    addHeader(params) {
        return this.clase.addHeader(params);
    }

    addGroup(params) {
        return this.clase.addGroup(params);
    }

    getHeaders() {
        return this.clase.getHeaders();
    }

    getHeadersGroups(tarifario_header_id) {
        return this.clase.getHeadersGroups(tarifario_header_id);
    }

    getPrice(id) {
        var promise;
        if (this.terminal === undefined) {
            promise = new Promise((resolve, reject) => {
                reject({ status: "ERROR", message: "Debe proveer la terminal." });
            });
        } else {
            promise = this.clase.getPrice(id);
        }
        return promise;
    }

    getPrices(params) {
        var promise;
        if (this.terminal === undefined) {
            promise = new Promise((resolve, reject) => {
                reject({ status: "ERROR", message: "Debe proveer la terminal." });
            });
        } else {
            promise = this.clase.getPrices(params);
        }
        return promise;
    }

    getRates(callback) {
        this.clase.getRates(callback);
    }

    rates(withDescription, callback) {
        if (typeof withDescription === "function") {
            callback = withDescription;
            withDescription = false;
        }
        this.clase.rates({ description: withDescription }, callback);
    }

    ratePrices(fecha, callback) {
        var moment = require("moment");
        if (typeof fecha === "function") {
            callback = fecha;
            fecha = Date.now();
        }
        fecha = moment(fecha);
        if (this.db === "MONGODB") {
            this.clase.rates({ fecha: fecha }, callback);
        } else {
            fecha = moment(fecha).format("YYYY-MM-DD")
            this.clase.ratePrices(fecha, callback);
        }
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }

}


module.exports = Price;