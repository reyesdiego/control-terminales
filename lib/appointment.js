/**
 * Created by diego on 01/11/16.
 */

"use strict";

class AppointmentOracle {
    constructor(connection) {
        this.cn = connection;
    }

    add() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    update() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getContainersActive() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getById() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getAppointments() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getByContainer() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getCountByDay() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT YET IMPLEMENTED ORACLE"
            });
        });
    }

    getByPatente() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getPatentesActive() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED - getPatentesActive"
            });
        });
    }

    getDistinct() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    getMissingAppointments() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    setCancel() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    setTransporte() {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT IMPLEMENTED"
            });
        });
    }

    setHold() {
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
    constructor(model) {
        this.model = model;
        this.price = require("../include/price.js");
        this.invoice = require("../models/invoice.js");
    }

    add(param) {
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
                    let errCode;
                    if (err.code === 11000) {
                        errCode = err.code;
                    }
                    reject({
                        status: "ERROR",
                        code: errCode,
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

    update(param) {
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

            this.model.update({ _id: param._id }, { $set: param }, err => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    this.getById(param._id)
                        .then(data => {
                            resolve(data);
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
            });
        });
    }

    getContainersActive() {
        return new Promise((resolve, reject) => {
            let param = {};
            const moment = require("moment");
    
            param.inicio = {
                $gte: moment(moment().format("YYYY-MM-DD")).toDate(),
                $lt: moment(moment().add(1, "d").format("YYYY-MM-DD")).toDate(),
            };
            param["status.status"] = {$ne: 9};
    
            this.model.distinct("contenedor", param)
                .exec((err, data) => {
                    if (err) {
                        reject({status: "ERROR", data: err.message});
                    } else {
                        resolve({
                            status: "OK",
                            totalCount: data.length,
                            data: data.sort() || []
                        });
                    }
                });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            var param = {};

            if (id === undefined) {
                reject({ status: "ERROR", data: "Debe proveer el dato del id para obtener el turnos." });
            } else {

                if (id) {
                    param._id = id;
                }

                this.model.find(param)
                    .exec((err, data) => {
                        if (err) {
                            reject({ status: "ERROR", data: err.message });
                        } else {
                            resolve({ status: "OK", data: data[0] });
                        }
                    });
            }
        });
    }

    getAppointments(params, options) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var param = {},
                fechaIni,
                fechaFin,
                order;
            var appointments;

            if (params.fechaInicio && params.fechaFin) {
                param.$or = [];
                fechaIni = moment(moment(params.fechaInicio, ["YYYY-MM-DD HH:mm Z"]));
                param.$or.push({ inicio: { $lte: fechaIni }, fin: { $gte: fechaIni } });
                fechaFin = moment(moment(params.fechaFin, ["YYYY-MM-DD HH:mm Z"]));
                param.$or.push({ inicio: { $lte: fechaFin }, fin: { $gte: fechaFin } });
                param.$or.push({ inicio: { $gte: fechaIni }, fin: { $lte: fechaFin } });
            }

            if (params.usr.role === "agp") {
                param.terminal = params.terminal;
            } else {
                param.terminal = params.usr.terminal;
            }

            if (params.buque) {
                param.buque = params.buque;
            }

            if (params.viaje) {
                param.viaje = params.viaje;
            }

            if (params.contenedor) {
                param.contenedor = params.contenedor;
            }

            if (params.mov) {
                param.mov = params.mov;
            }

            if (params.email) {
                param.email = params.email;
            }

            appointments = this.model.find(param).limit(options.limit).skip(options.skip);

            if (options.order) {
                order = JSON.parse(options.order);
                appointments.sort(order[0]);
            } else {
                appointments.sort({ inicio: -1 });
            }

            appointments.exec((err, appointments) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    this.model.count(param, (err, cnt) => {
                        var result = {
                            status: "OK",
                            totalCount: cnt,
                            data: appointments
                        };
                        resolve(result);
                    });
                }
            });
        });
    }

    getByContainer(params) {
        return new Promise((resolve, reject) => {
            var param = {};

            if (params.contenedor) {
                param.contenedor = params.contenedor.toUpperCase();
            }

            if (params.email) {
                param.email = params.email.toLowerCase();
            }

            if (params.inicio) {
                param.inicio = params.inicio;
            }

            if (params._id) {
                param._id = params._id;
            }

            param["status.status"] = {$ne: 9};
            
            this.model.find(param)
                .exec((err, data) => {
                    if (err) {
                        reject({ status: "ERROR", data: err.message });
                    } else {
                        resolve({ status: "OK", data: data });
                    }
                });
        });

    }

    getCountByDay(params) {
        return new Promise((resolve, reject) => {
            reject({
                status: "ERROR",
                message: "NOT YET IMPLEMENTED MONGODB"
            });
        });
    }

    getByPatente(params) {
        return new Promise((resolve, reject) => {

            var param = {
                "transporte.camion": params.patenteCamion.toUpperCase(),
                inicio: params.inicio,
                "status.status": {$ne:9}
            };
            this.model
                .find(param, { _id: false, "transporte.camion": 1, contenedor: 1, inicio: 1, fin: 1, "transporte.dni": 1, "transporte.celular": 1 })
                .sort({ inicio: 1 })
                .exec((err, data) => {
                    if (err) {
                        reject({ status: "ERROR", data: err.message });
                    } else {
                        resolve({ status: "OK", data: data });
                    }
                });
        });
    }

    getPatentesActive() {
        return new Promise((resolve, reject) => {
            var Appointment = require("../models/appointment.js");
            var param = {};
            const moment = require("moment");
            
            param.inicio = {
                $gte: moment(moment().format("YYYY-MM-DD")).toDate(),
                $lt: moment(moment().add(1, "d").format("YYYY-MM-DD")).toDate(),
            };
            param["status.status"] = {$ne: 9};
    
            Appointment.distinct("transporte.camion", param)
                .exec((err, data) => {
                    if (err) {
                        reject({status: "ERROR", data: err.message});
                    } else {
                        resolve({
                            status: "OK",
                            totalCount: data.length,
                            data: data.sort() || []
                        });
                    }
                });
        });
    }

    getDistinct(params) {
        return new Promise((resolve, reject) => {
            var param = {};
            var distinct = "_id";
            if (params.distinct === "/:terminal/ships") {
                distinct = "buque";
            }

            if (params.usr.role === "agp") {
                param.terminal = params.terminal;
            } else {
                param.terminal = params.usr.terminal;
            }

            if (distinct !== "") {
                this.model.distinct(distinct, param, (err, data) => {
                    if (err) {
                        reject({ status: "ERROR", data: err });
                    } else {
                        resolve({ status: "OK", totalCount: data.length, data: data.sort() });
                    }
                });
            } else {
                reject({ status: "ERROR", message: "El ruta es inválida", data: [] });
            }
        });
    }

    getMissingAppointments(params) {
        return new Promise((resolve, reject) => {
            var self = this;
            var linq = require("linq");
            var param = {};
            if (params.terminal !== undefined) {
                param.terminal = params.terminal;
            }

            var _price = this.price;
            var _rates = new _price.price(param.terminal);
            _rates.rates((err, rates) => {

                self.invoice.aggregate([
                    { $match: { terminal: param.terminal, codTipoComprob: 1, "detalle.items.id": { $in: rates } } },
                    { $project: { detalle: 1, fecha: "$fecha.emision" } },
                    { $unwind: "$detalle" },
                    { $unwind: "$detalle.items" },
                    { $match: { "detalle.items.id": { $in: rates } } },
                    { $group: { _id: { c: "$detalle.contenedor", f: "$fecha" } } },
                    {
                        $project: {
                            _id: false,
                            c: "$_id.c",
                            f: "$_id.f"
                        }
                    }
                ]).exec((err, dataInvoices) => {
                    if (err) {
                        reject({ status: "ERROR", message: err.message, data: err });
                    } else {
                        self.model.find({ terminal: param.terminal }, { contenedor: true, _id: false })
                            .then(dataAppointments => {
                                var invoicesWoGates;
                                dataAppointments = linq.from(dataAppointments).select("{c: $.contenedor}");
                                invoicesWoGates = linq.from(dataInvoices)
                                    .except(dataAppointments, "$.c").toArray();
                                //.except(dataGates).toArray();

                                resolve({
                                    status: "OK",
                                    totalCount: invoicesWoGates.length,
                                    data: invoicesWoGates
                                });
                            })
                            .catch(err => {
                                reject({ status: "ERROR", message: err.message, data: err });
                            });
                    }
                });
            });
        });
    }

    setCancel(params) {
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

            this.model.update(param, { $set: { "status.status": 9, "status.date": new Date() } }, { multi: false }, (err, dataSaved) => {
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

    setTransporte(params) {
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

            if (params.patenteCamion === undefined || params.patenteCamion === null || params.patenteCamion === "") {
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

            this.model.update(param, { $set: { transporte: paramUpd } }, { multi: true }, (err, dataSaved) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {

                    if (dataSaved.n > 0) {
                        this.getById(params._id)
                            .then(data => {
                                resolve(data);
                            })
                            .catch(err => {
                                reject(err);
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

    setHold(params) {
        return new Promise((resolve, reject) => {
            var param = {};
            var paramUpd = {
                "hold.status": params.hold,
                "hold.date": new Date()
            };

            if (params._id === undefined) {
                reject({
                    status: "ERROR",
                    message: "El _id del Appointment es requerido"
                });
            } else {
                param._id = params._id;
            }

            this.model.update(param, { $set: paramUpd }, { multi: false }, (err, dataSaved) => {
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
                                hold: paramUpd["hold.status"],
                                date: paramUpd["hold.date"]
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
    constructor(connection) {
        if (connection !== undefined) {
            this.connection = connection;
            this.clase = new AppointmentOracle(this.connection);
        } else {
            this.connection = require("../models/appointment.js");
            this.clase = new AppointmentMongoDB(this.connection);
        }
    }

    add(param) {
        return this.clase.add(param);
    }

    update(param) {
        return this.clase.update(param);
    }

    getContainersActive() {
        return this.clase.getContainersActive();
    }

    getById(_id) {
        return this.clase.getById(_id);
    }

    getAppointments(params, options) {
        return this.clase.getAppointments(params, options);
    }

    getByContainer(params) {
        return this.clase.getByContainer(params);
    }

    getByPatente(params) {
        return this.clase.getByPatente(params);
    }

    getMissingAppointments(params) {
        return this.clase.getMissingAppointments(params);
    }

    setCancel(params) {
        return this.clase.setCancel(params);
    }

    getPatentesActive() {
        return this.clase.getPatentesActive();
    }

    getDistinct(params) {
        return this.clase.getDistinct(params);
    }

    setTransporte(params) {
        return this.clase.setTransporte(params);
    }

    setHold(params) {
        return this.clase.setHold(params);
    }

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }

}

module.exports = Appointment;