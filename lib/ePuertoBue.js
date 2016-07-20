/**
 * Created by diego on 21/06/16.
 */

"use strict";

class ePuertoBueOracle {
    constructor (connection) {
        this.cn = connection;
    }

    addShip(param, callback) {
        var pool = this.cn.pool;
        var strSql = '';
        var values;
        var moment = require('moment');

        if (pool) {
            pool.getConnection ((err, connection ) => {
                if (err) {
                    console.log("%s, Error en Oracle Adding Ship Entrace in OracleDb.", new Date());
                    this.cn.doRelease(connection);
                    if (callback) return callback({status: "ERROR", message: "Error en Oracle addInvoice", data: err});

                } else {
                    strSql = "insert into EBUE_SHIPS " +
                        "(ID," +
                        "TERMINAL," +
                        "BUQUE," +
                        "VIAJE," +
                        "ENTRADA_VANGUARDIA," +
                        "AMARRE," +
                        "INICIO_OPERACIONES," +
                        "FIN_OPERACIONES," +
                        "ZARPADA," +
                        "SALIDA_VANGUARDIA) VALUES (" +
                        ":id," +
                        ":terminal, " +
                        ":buque," +
                        ":viaje," +
                        "to_date(:entradaVanguardia, 'YYYY-MM-DD HH24:MI:SS')," +
                        "to_date(:amarre, 'YYYY-MM-DD HH24:MI:SS')," +
                        "to_date(:inicioOperaciones, 'YYYY-MM-DD HH24:MI:SS')," +
                        "to_date(:finOperaciones, 'YYYY-MM-DD HH24:MI:SS')," +
                        "to_date(:zarpada, 'YYYY-MM-DD HH24:MI:SS')," +
                        "to_date(:salidaVanguardia, 'YYYY-MM-DD HH24:MI:SS')" +
                        ") ";
                    values = {
                        id: param._id,
                        terminal: param.terminal,
                        buque: param.buque,
                        viaje: param.viaje,
                        entradaVanguardia: (param.entradaVanguardia === null || param.entradaVanguardia === '') ? null : moment(param.entradaVanguardia).format("YYYY-MM-DD HH:mm:ss"),
                        amarre: (param.amarre === null || param.amarre === '') ? null : moment(param.amarre).format("YYYY-MM-DD HH:mm:ss"),
                        inicioOperaciones: (param.inicioOperaciones === null || param.inicioOperaciones === '') ? null : moment(param.inicioOperaciones).format("YYYY-MM-DD HH:mm:ss"),
                        finOperaciones: (param.finOperaciones === null || param.finOperaciones === '') ? null : moment(param.finOperaciones).format("YYYY-MM-DD HH:mm:ss"),
                        zarpada: (param.zarpada === null || param.zarpada === '') ? null : moment(param.zarpada).format("YYYY-MM-DD HH:mm:ss"),
                        salidaVanguardia: (param.salidaVanguardia === null || param.salidaVanguardia === '') ? null : moment(param.salidaVanguardia).format("YYYY-MM-DD HH:mm:ss")
                    };
                    connection.execute(strSql, values, {autoCommit: true}, (err, result) => {
                        callback(err, result);
                    });
                }
            });
        }
    }

    toString () {
        return "ePuertoBue Class on Oracle";
    }
}

class ePuertoBueMongoDB {

    constructor (model) {
        this.model = model;
    }

    addShip (param, callback) {
        this.model.create(param, (err, data) => {
            if (err) {
                callback(err);
            } else {
                callback(undefined, data);
            }
        });
    }

    updateShip (param, callback) {
        const where = {_id: param._id};
        var paramSet = {$set:{}};

        if (param.amarre) {
            paramSet.$set.amarre = param.amarre;
        }

        if (param.inicioOperaciones) {
            paramSet.$set.inicioOperaciones = param.inicioOperaciones;
        }

        if (param.finOperaciones) {
            paramSet.$set.finOperaciones = param.finOperaciones;
        }

        if (param.zarpada) {
            paramSet.$set.zarpada = param.zarpada;
        }

        if (param.salidaVanguardia) {
            paramSet.$set.salidaVanguardia = param.salidaVanguardia;
        }

        this.model.update(where, paramSet, {}, (err, data) => {
            if (err) {
                callback(err);
            } else {
                callback(undefined, data);
            }
        });
    }

    toString () {
        return "ePuertoBue Class on Mongo DB";
    }
}

class ePuertoBue {
    constructor (connection) {
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new ePuertoBueOracle(this.connection);
        } else {
            this.connection = require('../models/ePuertoBue.js');
            this.clase = new ePuertoBueMongoDB(this.connection);
        }
    }

    addShip (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.addShip(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        return promise;
    }

    updateShip (params) {
        var promise = new Promise((resolve, reject) => {
            this.clase.updateShip(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        return promise;
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }

}

module.exports = ePuertoBue;