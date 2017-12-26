/*
 * Created on Wed Nov 23 2017
 *
 * Copyright (c) 2017 Diego Reyes
 */

"use strict";

var Constantes = require("./constantes.js");

/**
 * Clase Trailer en OracleDB
 * @author Diego Reyes
 * @class TrailerOracle
 */
class TrailerOracle {
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
    getTypes() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED YET - getTypes"
            });
        });
    }
}
/**
 * Clase Trailer en MongoDB
 * @author Diego Reyes
 * @class TrailerMongoDB
 */
class TrailerMongoDB {
    constructor(cn) {
        this.model = cn;
        this.types = require("../models/trailertype");
    }
    add(params) {
        return new Promise((resolve, reject) => {
            this.model
                .create(params)
                .then(TrailerNew => {
                    resolve({
                        status: "OK",
                        data: TrailerNew
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
    getTypes() {
        return new Promise((resolve, reject) => {
            this.types
                .find({})
                .sort({ _id: 1 })
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
 * Clase Trailer. Implementa el manejo de Playos en ZAP.
 * @author Diego Reyes
 * @class Trailer
 */
class Trailer extends Constantes {
    constructor(connection) {
        super();
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new TrailerOracle(this.connection);
            this.db = "ORACLE";
        } else {
            this.connection = require("../models/trailer.js");
            this.clase = new TrailerMongoDB(this.connection);
            this.db = "MONGODB";
        }
    }
    /**
     * Inserta un Playo en la base de datos.
     * 
     * @param {Object} params 
     * @returns {new Promise}
     * @memberof Trailer
     */
    add(params) {
        return this.clase.add(params);
    }
    /**
     * Obtiene un Playo de la base de datos filtrado por Patente.
     * 
     * @param {String} id
     * @returns {new Promise}
     * @memberof Trailer
     */
    getById(id) {
        return this.clase.getById(id);
    }

    /**
     * Obtiene un Listado de Tipos de Semi.
     * 
     * @param {String} id
     * @returns {new Promise}
     * @memberof Trailer
     */
    getTypes() {
        return this.clase.getTypes();
    }

}

module.exports = Trailer;