/**
 * Created by diego on 01/11/16.
 */

'use strict';

class AppointmentOracle {
    constructor (connection) {
        this.cn = connection;
    }

    add (param) {

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
            this.model.insert(param, function (errData, data) {
                if (errData) {
                    reject(errData);
                } else {
                    resolve(data);
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

    toString() {
        var stringClass = this.clase.toString();
        return `${stringClass}\n(by Diego Reyes)`;
    }

}

module.exports = Appointment;