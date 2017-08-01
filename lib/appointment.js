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

    update (param) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    setCancel (param) {
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

    setHold (param) {
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

            var patenteCheck = require("../include/patente.js");

            if (param.patenteCamion) {
                if (!patenteCheck.check(param.patenteCamion)) {
                    reject({
                        status: "ERROR",
                        message: "La Patente del Camion es Incorrecta",
                        data: param.patenteCamion
                    });
                }
                param.transporte = {
                    camion: param.patenteCamion
                };
                delete param.patenteCamion;

                if (param.patenteSemi) {
                    if (!patenteCheck.check(param.patenteSemi)) {
                        reject({
                            status: "ERROR",
                            message: "La Patente del Semi es Incorrecta",
                            data: param.patenteSemi
                        });
                    }
                    param.transporte.semi = param.patenteSemi;
                    delete param.patenteSemi;
                }
                if (param.dni) {
                    param.transporte.dni = param.dni;
                    delete param.dni;
                }
                if (param.celular) {
                    param.transporte.celular = param.celular;
                    delete param.celular;
                }
            }

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

    update (param) {
        return new Promise((resolve, reject) => {

            var patenteCheck = require("../include/patente.js");

            if (param.patenteCamion) {
                if (!patenteCheck.check(param.patenteCamion)) {
                    reject({
                        status: "ERROR",
                        message: "La Patente del Camion es Incorrecta",
                        data: param.patenteCamion
                    });
                }
                param.transporte = {
                    camion: param.patenteCamion
                };
                delete param.patenteCamion;

                if (param.patenteSemi) {
                    if (!patenteCheck.check(param.patenteSemi)) {
                        reject({
                            status: "ERROR",
                            message: "La Patente del Semi es Incorrecta",
                            data: param.patenteSemi
                        });
                    }
                    param.transporte.semi = param.patenteSemi;
                    delete param.patenteSemi;
                }
                if (param.dni) {
                    param.transporte.dni = param.dni;
                    delete param.dni;
                }
                if (param.celular) {
                    param.transporte.celular = param.celular;
                    delete param.celular;
                }
            }

            this.model.update( {_id: param._id}, {$set: param}, (err, data) => {
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

    setCancel (params) {
        return new Promise((resolve, reject) => {
            var param = {};

            if (params._id === undefined) {
                reject({
                    status: "ERROR",
                    message: "El _id del Appointment es requerido"
                });
            } else {
                param._id = params._id;
            }

            this.model.update(param, {$set: {'status.status': 9, 'status.date': new Date()} }, {multi: false},(err, dataSaved) => {
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
                            message: "Turno Cancelado",
                            data: {
                                _id: params._id,
                                status: 9
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

    setTransporte (params) {
        return new Promise((resolve, reject) => {
            var param = {};
            var paramUpd = {};

            var patenteCheck = require("../include/patente.js");

            if (params._id === undefined) {
                param.contenedor = params.contenedor;
                param.buque = params.buque;
            } else {
                param._id = params._id;
            }

            if (params.patenteCamion === undefined || params.patenteCamion === null || params.patenteCamion === '') {
                reject({
                    status: "ERROR",
                    message: "La Patente del Camion es Requerida",
                    data: params
                });
            }

            if (params.patenteCamion) {
                if (!patenteCheck.check(params.patenteCamion)) {
                    reject({
                        status: "ERROR",
                        message: "La Patente del Camion es Incorrecta",
                        data: params.patenteCamion
                    });
                }
                paramUpd.camion = params.patenteCamion;
            }
            if (params.patenteSemi) {
                if (!patenteCheck.check(params.patenteSemi)) {
                    reject({
                        status: "ERROR",
                        message: "La Patente del Semi es Incorrecta",
                        data: params.patenteSemi
                    });
                }
                paramUpd.semi = params.patenteSemi;
            }
            if (params.dni) {
                paramUpd.dni = params.dni;
            }
            if (params.celular) {
                paramUpd.celular = params.celular;
            }
            paramUpd.date = new Date();

            this.model.update(param, {$set: { transporte: paramUpd} }, {multi: true},(err, dataSaved) => {
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

    setHold (params) {
        return new Promise((resolve, reject) => {
            var param = {};
            var paramUpd = {
                'hold.status': params.hold,
                'hold.date': new Date()
            };

            if (params._id === undefined) {
                reject({
                    status: "ERROR",
                    message: "El _id del Appointment es requerido"
                });
            } else {
                param._id = params._id;
            }

            this.model.update(param, {$set: paramUpd }, {multi: false},(err, dataSaved) => {
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
                                _id: params._id,
                                hold: paramUpd['hold.status'],
                                date: paramUpd['hold.date']
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

    update (param) {
        return this.clase.update(param);
    }

    setCancel (params) {
        return this.clase.setCancel(params);
    }

    setTransporte (params) {
        return this.clase.setTransporte(params);
    }

    setHold (params) {
        return this.clase.setHold(params);
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }

}

module.exports = Appointment;