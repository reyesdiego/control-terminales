/**
 * Created by diego on 10/26/15.
 */
'use strict';

var Constantes = require('./constantes.js');


class GateOracle {
    constructor (connection) {
        this.cn = connection;
    }
    getGates (params, callback) {
        var self = this;
        var strSql,
            strWhere = '';
        var pool = this.cn.pool;
        var async = require("async");
        var moment = require("moment");
        var taskAsync;
        var tasksAsync = [];
        var skip,
            limit,
            orderBy,
            util = require("util");

        if (pool) {

            skip = parseInt(params.skip, 10);
            limit = parseInt(params.limit, 10);
            orderBy = this.cn.orderBy(params.order);

            if (params.terminal || params.buque || params.viaje || params.contenedor || params.carga || params.tren || params.patenteCamion || params.fechaInicio || params.fechaFin) {
                strWhere += " WHERE ";
            }

            if (params.terminal) {
                strWhere += util.format(" TERMINAL = '%s' AND ", params.terminal);
            }

            if (params.buque) {
                strWhere += util.format(" BUQUE = '%s' AND ", params.buque);
            }

            if (params.viaje) {
                strWhere += util.format(" VIAJE = '%s' AND ", params.viaje);
            }

            if (params.contenedor) {
                strWhere += util.format(" CONTENEDOR = '%s' AND ", params.contenedor);
            }

            if (params.carga) {
                strWhere += util.format(" CARGA = '%s' AND ", params.carga);
            }

            if (params.tren) {
                if (params.tren['$exists']) {
                    strWhere += " TREN is not null AND ";
                } else {
                    strWhere += util.format(" TREN = '%s' AND ", params.tren);
                }
            }

            if (params.patenteCamion) {
                strWhere += util.format(" PATENTECAMION = '%s' AND ", params.patenteCamion);
            }

            if (params.fechaInicio || params.fechaFin) {
                if (params.fechaInicio) {
                    strWhere += util.format(" GATETIMESTAMP >= TO_TIMESTAMP('%s', 'RRRR-MM-DD HH24:Mi:ss') AND ", moment(params.fechaInicio).format('YYYY-MM-DD HH:mm:ss'));
                }
                if (params.fechaFin) {
                    strWhere += util.format(" GATETIMESTAMP <= TO_TIMESTAMP('%s', 'RRRR-MM-DD HH24:Mi:ss') AND ", moment(params.fechaFin).format('YYYY-MM-DD HH:mm:ss'));
                }
            }

            strWhere = strWhere.substr(0, strWhere.length - 4);

            taskAsync = function (asyncCallback) {
                pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log("%s, Error en Oracle getGates.", new Date());
                        self.cn.doRelease(connection);
                        asyncCallback(err);
                    } else {
                        strSql = "SELECT * " +
                            "FROM " +
                            "(SELECT ROW_NUMBER() Over (Order By " + orderBy + ") R, " +
                            "    gates.ID, " +
                            "    gates.TERMINAL, " +
                            "    gates.BUQUE, " +
                            "    gates.VIAJE, " +
                            "    gates.CONTENEDOR, " +
                            "    gates.CARGA, " +
                            "    gates.MOV, " +
                            "    gates.TIPO, " +
                            "    gates.GATETIMESTAMP, " +
                            "    gates.TURNOINICIO, " +
                            "    gates.TURNOFIN, " +
                            "    gates.PATENTECAMION, " +
                            "    gates.TREN " +
                            "FROM gates %s ) " +
                            "where  R between :1 AND :2 ";

                        strSql = util.format(strSql, strWhere);

                        connection.execute(strSql, [skip, skip + limit], {}, function (err, data) {
                            if (err) {
                                self.cn.doRelease(connection);
                                asyncCallback(err);
                            } else {
                                self.cn.doRelease(connection);
                                data = data.rows.map(function (item) {
                                    return {
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
                                        tren: item.TREN };
                                });
                                asyncCallback(undefined, data);
                            }
                        });
                    }
                });
            }
            tasksAsync.push(taskAsync);

            taskAsync = function (asyncCallback) {
                pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log("%s, Error en Oracle getGates.", new Date());
                        self.cn.doRelease(connection);
                        asyncCallback(err);
                    } else {
                        strSql = "SELECT count(*) cnt from gates";
                        if (strWhere !== '') {
                            strSql += util.format(" %s", strWhere);
                        }
                        connection.execute(strSql, [], {}, function (err, data) {
                            if (err) {
                                asyncCallback(err);
                            } else {
                                asyncCallback(undefined, data.rows[0]);
                            }
                        });
                    }
                });
            }
            tasksAsync.push(taskAsync);

            async.parallel(tasksAsync, function (err, data) {
                let result;
                if (err) {
                    result = {
                        status: "ERROR",
                        message: err.message,
                        data: err
                    };
                    if (callback) return callback(result);
                } else {
                    let total = data[1].CNT;
                    result = {
                        status: "OK",
                        totalCount: total,
                        pageCount: (limit > total) ? total : limit,
                        data: data[0]
                    };
                    if (callback) return callback(undefined, result);
                }
            });
        }
    }

    getByHour (params, callback) {
        var self = this;
        var strSql;
        var pool = this.cn.pool;

        if (pool) {
            pool.getConnection(function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle getShipTrips.", new Date());
                    if (callback) return callback(err);
                } else {
                    strSql = "select terminal, to_number(to_char(gatetimestamp, 'HH24')) hora,  count(*) cnt " +
                        "from gates " +
                        "where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND " +
                        "gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd') " +
                        "group by terminal, to_char(gatetimestamp, 'HH24') ";
                    connection.execute(strSql,[params.fechaInicio, params.fechaFin], {}, function (err, data) {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback(err);
                        } else {
                            if (callback) callback(undefined, data.rows.map(function (item) {return {_id: {terminal: item.TERMINAL, hour: item.HORA}, cnt: item.CNT}}));
                        }
                    });
                }
            });
        }
    }

    getByMonth (params, callback) {
        var self = this,
            moment = require("moment");
        var strSql;
        var pool = this.cn.pool;

        if (pool) {
            pool.getConnection(function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle getShipTrips.", new Date());
                    if (callback) return callback(err);
                } else {
                    let inicio = moment(params.fechaInicio).format("YYYY-MM-DD");
                    let fin = moment(params.fechaFin).format("YYYY-MM-DD");
                    strSql = "select terminal, to_number(to_char(gatetimestamp, 'YYYY')) year, to_number(to_char(gatetimestamp, 'MM')) mes,  to_number(to_char(gatetimestamp, 'YYYYMM')) DIA, count(*) cnt " +
                        "from gates " +
                        "where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND " +
                        "gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd') " +
                        "group by terminal, to_char(gatetimestamp, 'YYYY'), to_char(gatetimestamp, 'MM'), to_char(gatetimestamp, 'YYYYMM') " +
                        "ORDER BY DIA, TERMINAL";
                    connection.execute(strSql,[inicio, fin], {}, function (err, data) {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback(err);
                        } else {
                            if (callback) callback(undefined, data.rows.map(function (item) {return {_id: {terminal: item.TERMINAL, year: item.YEAR, month: item.MES}, cnt: item.CNT}}));
                        }
                    });
                }
            });
        }
    }

    getDistinct (params, callback) {
        var self = this;
        var strSql;
        var pool = self.cn.pool;

        if (pool) {
            pool.getConnection(function (err, connection) {
                if (err) {
                    if (callback) return callback(err);
                } else {
                    strSql = `select distinct ${params.distinct} from gates where terminal = :1 order by ${params.distinct}`;
                    connection.execute(strSql, [params.terminal], {outFormat: self.cn.oracledb.ARRAY}, function (err, data) {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback(err);
                        } else {
                            let result = data.rows.map(function (item) {return item[0];});
                            if (callback) return callback(undefined, result);
                        }
                    });
                }
            });
        }
    }

    add (gate, callback) {
        var self = this;
        var strSql,
            values;
        var pool = self.cn.pool;
        var moment = require("moment");

        if (pool) {
            pool.getConnection(function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle add Gate.", new Date());
                    if (callback) return callback(err);
                } else {
                    strSql = "insert into GATES " +
                        "(ID," +
                        "TERMINAL," +
                        "BUQUE," +
                        "VIAJE," +
                        "CONTENEDOR," +
                        "CARGA," +
                        "MOV," +
                        "TIPO," +
                        "GATETIMESTAMP," +
                        "TURNOINICIO," +
                        "TURNOFIN," +
                        "PATENTECAMION," +
                        "TREN) VALUES (" +
                        "gates_seq.nextval," +
                        " :terminal, :buque, :viaje, :contenedor, :carga, :mov, :tipo, to_date(:gateTimestamp, 'YYYY-MM-DD HH24:MI:SS'), to_date(:turnoInicio, 'YYYY-MM-DD HH24:MI:SS'), to_date(:turnoFin, 'YYYY-MM-DD HH24:MI:SS'), :patenteCamion, :tren)";
                    values = {
                        terminal: gate.terminal,
                        buque: gate.buque,
                        viaje: gate.viaje,
                        contenedor: gate.contenedor,
                        carga: gate.carga,
                        mov: gate.mov,
                        tipo: gate.tipo,
                        gateTimestamp: moment(gate.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"),
                        turnoInicio: (gate.turnoInicio === null ) ? null : moment(gate.turnoInicio).format("YYYY-MM-DD hh:mm:ss"),
                        turnoFin: (gate.turnoFin === null ) ? null : moment(gate.turnoFin).format("YYYY-MM-DD hh:mm:ss"),
                        patenteCamion: gate.patenteCamion,
                        tren: gate.tren
                    };
                    connection.execute(strSql, values, {autoCommit:true}, function(err, result) {
                        self.cn.doRelease(connection);
                        if (err) {
                            if (callback) return callback(err);
                        } else {
                            result = {
                                status: 'OK',
                                data: result
                            };
                            if (callback) return callback(undefined, result);
                        }
                    });

                }
            });
        }
    }

    toString() {
        return "Gate class on Oracle 11g";
    }

}

class GateMongoDB {
    constructor (model) {
        this.model = model;
    }
    getGates (params, callback) {
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

        taskAsync = function (asyncCallback) {
            let gates = Gate.find(params, {__v: 0}).limit(limit).skip(skip);
            if (order) {
                order = JSON.parse(order);
                gates.sort(order[0]);
            } else {
                gates.sort({gateTimestamp: -1});
            }
            gates.lean();
            gates.exec(function (err, data) {
                if (err) {
                    callback({status: "ERROR", data: err});
                } else {
                    asyncCallback(undefined, data);
                }
            });
        };
        tasksAsync.push(taskAsync);

        taskAsync = function (asyncCallback) {
            Gate.count(params, function (err, cnt) {
                asyncCallback(undefined, cnt);
            });

        };
        tasksAsync.push(taskAsync);

        async.parallel(tasksAsync, function (err, results) {
            let result;
            if (err) {
                result = {
                    status: 'ERROR',
                    data: err
                };
                callback(result);
            } else {
                let pageCount = results[0].length;
                result = {
                    status: 'OK',
                    pageCount: (limit > pageCount) ? pageCount : limit,
                    page: skip,
                    totalCount: results[1],
                    data: results[0]
                };
                callback(undefined, result);
            }
        });
    }

    getByHour (params, callback) {
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
                _id : { terminal: '$terminal',
                    hour: { $hour : "$gateTimestamp" }
                },
                cnt : { $sum : 1 }
            }},
            { $sort: {'_id.hour': 1, '_id.terminal': 1 }}
        ];

        this.model.aggregate(jsonParam, function (err, data) {
            if (err) {
                if (callback) return callback(err);
            } else {
                if (callback) return callback(undefined, data);
            }
        });
    }

    getByMonth (params, callback) {
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
                dia: {$dateToString: { format: "%Y%m", date: {$subtract: [ '$gateTimestamp', 180 * 60 * 1000]} }},
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
            { $sort: {'_id.dia': 1, '_id.terminal': 1 }}
        ];

        this.model.aggregate(jsonParam, function (err, data) {
            if (err) {
                if (callback) return callback(err);
            } else {
                if (callback) return callback(undefined, data);
            }
        });
    }

    getDistinct(params, callback) {
        var jsonParam;
        jsonParam = {
            terminal: params.terminal
        };
        this.model.distinct(params.distinct, jsonParam, function (err, data) {
            if (err) {
                if (callback) return callback(err);
            } else {
                if (callback) return callback(undefined, data);
            }
        });
    }

    add (gate, callback) {

        var gate2insert = gate;

        if (gate2insert) {
            this.model.insert(gate2insert, function (errSave, gateNew) {
                var socketMsg;
                if (errSave) {
                    if (callback) callback(errSave);
                } else {
                    socketMsg = {
                        status: 'OK',
                        data: gateNew
                    };
                    if (callback) callback(undefined, socketMsg);
                }
            });
        }
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

    getGates (params, callback) {
        this.clase.getGates(params, callback);
    }
    getByHour (params, callback) {
        this.clase.getByHour(params, callback);
    }

    getByMonth (params, callback) {
        var moment = require("moment");

        var fechaInicio = moment(params.fechaInicio, "YYYY-MM-DD");
        params.fechaInicio = moment([fechaInicio.year(), fechaInicio.month(), 1]).toDate();

        var fechaFin = moment(params.fechaFin, "YYYY-MM-DD");
        params.fechaFin = moment([fechaFin.year(), fechaFin.month(), 1]).add(1, 'month').toDate();

        this.clase.getByMonth(params, callback);
    }

    getDistinct (params, callback) {
        this.clase.getDistinct(params, callback);
    }

    add (newGate, options, callback) {

        var validate = {},
            trimBody;
        /** mantengo al parametro newGate como si fuere pasado por valor. */
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

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }
}

module.exports = Gate;