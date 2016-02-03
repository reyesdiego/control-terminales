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
        var linq = require("linq");
        var strSql;
        var pool = this.cn.pool;

        if (pool) {
            pool.getConnection(function (err, connection) {
                if (err) {
                    console.log("%s, Error en Oracle getShipTrips.", new Date());
                    if (callback) return callback(err);
                } else {
                    strSql = "select * from gates where contenedor = :1";
                    connection.execute(strSql, ['FRLU8605671'], {}, function (err, result) {
                        this.cn.release(connection);
                        result = linq.from(result.rows).select("x=>{_id: x.ID,contenedor: x.CONTENEDOR}").toArray();
                        if (callback) return callback(undefined, result);
                    });
                }
            });
        }
    }

    getByHour (params, callback) {
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
                    console.log("%s, Error en Oracle getShipTrips.", new Date());
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
                        " :1, :2, :3, :4, :5, :6, :7, to_date(:8, 'YYYY-MM-DD HH24:MI:SS'), to_date(:9, 'YYYY-MM-DD HH24:MI:SS'), to_date(:10, 'YYYY-MM-DD HH24:MI:SS'), :11, :12)";
                    values = [gate.terminal,
                        gate.buque,
                        gate.viaje,
                        gate.contenedor,
                        gate.carga,
                        gate.mov,
                        gate.tipo,
                        moment(gate.gateTimestamp).format("YYYY-MM-DD hh:mm:ss"),
                        (gate.turnoInicio === null ) ? null : moment(gate.turnoInicio).format("YYYY-MM-DD hh:mm:ss"),
                        (gate.turnoFin === null ) ? null : moment(gate.turnoFin).format("YYYY-MM-DD hh:mm:ss"),
                        gate.patenteCamion,
                        gate.tren];
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
        var gates = Gate.find({contenedor: "FRLU8605671"});
        gates.exec(function (err, data){
            if (callback) callback(data);
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
        validate
            .validate('patenteCamion', 'patenteCamion is invalid.', {ignoreEmpty: true})
            .isLength(1, 6, 6)
            .isLicensePlate();
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

        var validate = {};

        if (typeof options === 'function') {
            callback = options;
        } else if (typeof options === 'object') {
            if (options.validate){
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