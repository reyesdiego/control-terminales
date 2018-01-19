/*
 * Created on Wed Nov 22 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";

var Constantes = require("./constantes.js");

/**
 * Clase Truck en OracleDB
 * @author Diego Reyes
 * @class TruckOracle
 */
class TruckOracle {
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
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET - getById"
            });
        });
    }
    getColors() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET - getColor"
            });
        });
    }
    getTrades(id) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET - getTrades"
            });
        });
    }
    update(param) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET - update"
            });
        });
    }
    

}
/**
 * Clase Truck en MongoDB
 * @author Diego Reyes
 * @class TruckMongoDB
 */
class TruckMongoDB {
    constructor(cn) {
        this.model = cn;
        this.trades = require("../models/truckTrade");
        this.colors = require("../models/color");
    }
    add(params) {
        return new Promise((resolve, reject) => {
            this.model
                .create(params)
                .then(TruckNew => {
                    resolve({
                        status: "OK",
                        data: TruckNew
                    });
                })
                .catch(err => {
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
            this.model
                .findOne({ _id: id })
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

    getColors() {
        return new Promise((resolve, reject) => {
            this.colors
                .find({})
                .sort({ _id: 1 })
                .lean()
                .exec()
                .then(data => {
                    resolve({ status: "OK", data: data });
                })
                .catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });
        });
    }
    getTrades() {
        return new Promise((resolve, reject) => {
            this.trades
                .find({})
                .sort({ _id: 1 })
                .lean()
                .exec()
                .then(data => {
                    resolve({ status: "OK", data: data });
                })
                .catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });
        });
    }
    update(params) {
        return new Promise((resolve, reject) => {
            this.model
                .update({_id: params._id}, {$set: params}, {multi: false})
                .then(TruckNew => {
                    resolve({
                        status: "OK",
                        data: TruckNew
                    });
                })
                .catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });
        });
    }

}
/**
 * Clase Truck. Implementa el manejo de Camiones en ZAP.
 * @author Diego Reyes
 * @class Truck
 */
class Truck extends Constantes {
    constructor(connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new TruckOracle(this.connection);
            this.db = "ORACLE";
        } else {
            this.connection = require("../models/truck.js");
            this.clase = new TruckMongoDB(this.connection);
            this.db = "MONGODB";
        }
    }
    /**
     * Inserta un Camion en la base de datos.
     * 
     * @param {Object} params 
     * @returns {new Promise}
     * @memberof Truck
     */
    add(params) {
        return this.clase.add(params);
    }
    /**
     * Obtiene un Camion de la base de datos filtrado por DNI.
     * 
     * @param {String} id
     * @returns {new Promise}
     * @memberof Truck
     */
    getById(id) {
        return this.clase.getById(id);
    }
    getColors() {
        return this.clase.getColors();
    }
    getTrades() {
        return this.clase.getTrades();
    }
    update(param) {
        return this.clase.update(param);
    }
}

module.exports = Truck;