/*
 * Created on Wed Nov 22 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";

var Constantes = require("./constantes.js");

/**
 * Clase TruckHistory en OracleDB
 * @author Diego Reyes
 * @class TruckHistoryOracle
 */
class TruckHistoryOracle {
    constructor(cn) {
        this.cn = cn;
    }
    add(params) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET - add"
            });
        });
    }
    getById(id) {
        return new Promise((reject, resolve) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET - getById"
            });
        });
    }
}
/**
 * Clase TruckHistory en MongoDB
 * @author Diego Reyes
 * @class TruckHistoryMongoDB
 */
class TruckHistoryMongoDB {
    constructor(cn) {
        this.model = cn;
    }
    add(params) {
        return new Promise((resolve, reject) => {
            this.model.findOne({_id: params._id})
                .then(history => {
                    if (history !== undefined && history !== null) {
                        history.driverId = params.driverId;
                        history.trailerId = params.trailerId;
                        history.drivers.push(params.driverId);
                        history.drivers = [...new Set(history.drivers.map(a => a))];
                        history.trailers.push(params.trailerId);
                        history.trailers = [...new Set(history.trailers.map(a => a))];
                        history.save((err, dataSaved) => {
                            if (err) {
                                reject({
                                    status: "ERROR",
                                    message: err.message,
                                    data: err
                                });
                            } else {
                                resolve({
                                    status: "OK",
                                    data: dataSaved
                                });
                            }
                        });
                    } else {
                        params.drivers = [params.driverId];
                        params.trailers = [params.trailerId];
                        this.model.create(params)
                            .then(truckHistoryNew => {
                                resolve({
                                    status: "OK",
                                    data: truckHistoryNew
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
                })
                .catch (err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            this.model.findOne({ _id: id })
                .populate("_id")
                .populate("driverId")
                .populate("trailerId")
                .lean()
                .exec((err, data) => {
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
}
/**
 * Clase TruckHistory. Implementa el manejo de Camiones en ZAP.
 * @author Diego Reyes
 * @class TruckHistory
 */
class TruckHistory extends Constantes {
    constructor(connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new TruckHistoryOracle(this.connection);
            this.db = "ORACLE";
        } else {
            this.connection = require("../models/truckHistory.js");
            this.clase = new TruckHistoryMongoDB(this.connection);
            this.db = "MONGODB";
        }
    }
    /**
     * Inserta un Camion en la base de datos.
     * 
     * @param {Object} params 
     * @returns {new Promise}
     * @memberof TruckHistory
     */
    add(params) {
        return this.clase.add(params);
    }
    /**
     * Obtiene un Camion de la base de datos filtrado por DNI.
     * 
     * @param {String} id
     * @returns {new Promise}
     * @memberof TruckHistory
     */
    getById(id) {
        return this.clase.getById(id);
    }
}

module.exports = TruckHistory;