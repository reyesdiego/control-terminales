/**
 * Created by diego on 01/11/16.
 */

'use strict';

class AppointmentOracle {
    constructor (connection) {
        this.cn = connection;
    }

    add (param) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    setTransporte (param) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    toString() {
        return "Appointment class on Oracle";
    }
}

class AppointmentMongoDB {
    constructor (model) {
        this.model = model;
    }

    add (param) {
        return new Promise((resolve, reject) => {
            this.model.create(param, (err, data) => {
                if (err) {
                    reject({
                        status: 'ERROR',
                        message: err.message,
                        data: err
                    });
                } else {
                    resolve({
                        status: 'OK',
                        data: data
                    });
                }
            });
        });
    }

    setTransporte (params) {
        return new Promise((resolve, reject) => {
            var param = {};

            if (params._id === undefined) {
                param.contenedor = params.contenedor;
                param.buque = params.buque;
            } else {
                param._id = params._id;
            }

            var paramUpd = {
                camion: params.camion,
                semi: params.semi,
                dni: params.dni,
                celular: params.celular,
                date: new Date()
            };

            this.model.update(param, {$set: { transporte: paramUpd} }, (err, dataSaved) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    if (dataSaved.n > 0) {
                        resolve({
                            status: "OK",
                            data: {
                                transporte: paramUpd
                            }
                        });
                    } else {
                        reject({
                            status: "ERROR",
                            message: "No se ha encontrado el Turno",
                            data: params
                        });
                    }
                }
            });
        });
    }

    toString() {
        return "Appointment class on MongoDB";
    }
}

class Appointment {
    constructor (connection) {
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new AppointmentOracle(this.connection);
        } else {
            this.connection = require('../models/appointment.js');
            this.clase = new AppointmentMongoDB(this.connection);
        }
    }

    add (param) {
        return this.clase.add(param);
    }

    setTransporte (params) {
        return this.clase.setTransporte(params);
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }

}

module.exports = Appointment;