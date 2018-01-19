/*
 * Created on Wed Nov 22 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";

var Constantes = require("./constantes.js");

/**
 * Clase Driver en OracleDB
 * @author Diego Reyes
 * @class DriverOracle
 */
class DriverOracle {
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
 * Clase Driver en MongoDB
 * @author Diego Reyes
 * @class DriverMongoDB
 */
class DriverMongoDB {
    constructor(cn) {
        this.model = cn;
    }
    add(params) {
        return new Promise((resolve, reject) => {
            this.model.create(params)
                .then(driverNew => {
                    resolve({
                        status: "OK",
                        data: driverNew
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
            this.model.findOne({ _id: id })
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
    update(params) {
        return new Promise((resolve, reject) => {
            this.model.update({_id: params._id}, {$set: params}, {multi: false})
                .then(driverNew => {
                    resolve({
                        status: "OK",
                        data: driverNew
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
 * Clase Driver. Implementa el manejo de Choferes en ZAP.
 * @author Diego Reyes
 * @class Driver
 */
class Driver extends Constantes {
    constructor(connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new DriverOracle(this.connection);
            this.db = "ORACLE";
        } else {
            this.connection = require("../models/driver.js");
            this.clase = new DriverMongoDB(this.connection);
            this.db = "'MONGODB";
        }
    }
    /**
     * Inserta un Chofer en la base de datos.
     * 
     * @param {Object} params 
     * @returns {new Promise}
     * @memberof Driver
     */
    add(params) {
        return this.clase.add(params);
    }
    /**
     * Obtiene un Chofer de la base de datos filtrado por DNI.
     * 
     * @param {Number} id
     * @returns {new Promise}
     * @memberof Driver
     */
    getById(id) {
        return this.clase.getById(id);
    }
    /**
     * Modifica un Chofer en la base de datos.
     * 
     * @param {Object} params 
     * @returns {new Promise}
     * @memberof Driver
     */
    update(param) {
        return this.clase.update(param);
    }
}

module.exports = Driver;