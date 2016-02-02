/**
 * Created by diego on 19/06/15.
 */

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../config/config.js');

var Account = require('../models/account.js'),
    Appointment = require('../models/appointment.js'),
    AppointmentEmailQueue = require('../models/appointmentEmailQueue.js'),
    Comment = require('../models/comment.js'),
    DocType = require('../models/docType.js'),
    Gate = require('../models/gate.js'),
    Invoice = require('../models/invoice.js'),
    MatchPrice = require('../models/matchPrice.js'),
    Price = require('../models/price.js'),
    Role = require('../models/role.js'),
    State = require('../models/state.js'),
    Task = require('../models/task.js'),
    UnitType = require('../models/unitType.js'),
    VoucherType = require('../models/voucherType.js');

describe('Models', function () {
    'use strict';

    before(function (done) {
        this.timeout(3000);
        mongoose.connect(config.mongo_url, config.mongo_opts);
        mongoose.connection.on('connected', function () {
            console.log("Conectado a Mongodb");
            done();
        });
    });

    describe('# Accounts', function () {
        it('should have all properties', function (done) {

            Account.schema.paths.should.have.property("email");
            Account.schema.paths.should.have.property("password");
            Account.schema.paths.should.have.property("terminal");
            Account.schema.paths.should.have.property("role");
            Account.schema.paths.should.have.property("user");
            Account.schema.paths.should.have.property("group");
            Account.schema.paths.should.have.property("full_name");
            Account.schema.paths.should.have.property("date_created");
            Account.schema.paths.should.have.property("token");
            Account.schema.paths.should.have.property("reset_token");
            Account.schema.paths.should.have.property("reset_token_expires_millis");
            Account.schema.paths.should.have.property("status");
            Account.schema.paths.should.have.property("acceso");
            Account.schema.paths.should.have.property("lastLogin");
            Account.schema.paths.should.have.property("emailToApp");

            //Son las 15 properties más el _id y el __v y en este caso 2 más por el inherit plugin del mongoosePassport
            Object.keys(Account.schema.paths).length.should.equal(19);

            done();
        });
        it('should not return any error on find', function (done) {
            var account = Account.find({}).limit(1);
            account.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });

    });

    describe('# Appointments', function () {

        it('should have all properties', function (done) {
            Appointment.schema.paths.should.have.property("terminal");
            Appointment.schema.paths.should.have.property("buque");
            Appointment.schema.paths.should.have.property("viaje");
            Appointment.schema.paths.should.have.property("contenedor");
            Appointment.schema.paths.should.have.property("inicio");
            Appointment.schema.paths.should.have.property("fin");
            Appointment.schema.paths.should.have.property("mov");
            Appointment.schema.paths.should.have.property("alta");
            Appointment.schema.paths.should.have.property("user");
            Appointment.schema.paths.should.have.property("disponibles_t1");
            Appointment.schema.paths.should.have.property("email");
            Appointment.schema.paths.should.have.property("emailStatus");
            Appointment.schema.paths.should.have.property("verifica");
            Appointment.schema.paths.should.have.property("verifica_turno");
            Appointment.schema.paths.should.have.property("verifica_tipo");

            Object.keys(Appointment.schema.paths).length.should.equal(17);
            done();

        });
        it('should not return any error on find', function (done) {
            var appointment = Appointment.find({}).limit(1);
            appointment.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# AppointmentsEmailQueue', function () {
        it('should have all properties', function (done) {

            AppointmentEmailQueue.schema.paths.should.have.property("status");
            AppointmentEmailQueue.schema.paths.should.have.property("date");
            AppointmentEmailQueue.schema.paths.should.have.property("terminal.description");
            AppointmentEmailQueue.schema.paths.should.have.property("appointment");

            Object.keys(AppointmentEmailQueue.schema.paths).length.should.equal(6);

            done();
        });
        it('should not return any error on find', function (done) {
            var appointmentEmailQueue = AppointmentEmailQueue.find({}).limit(1);
            appointmentEmailQueue.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# Comments', function () {
        this.timeout(50000);

        it('should have all properties', function (done) {
            Comment.schema.paths.should.have.property("title");
            Comment.schema.paths.should.have.property("comment");
            Comment.schema.paths.should.have.property("user");
            Comment.schema.paths.should.have.property("group");
            Comment.schema.paths.should.have.property("state");
            Comment.schema.paths.should.have.property("invoice");

            Object.keys(Comment.schema.paths).length.should.equal(8);

            done();
        });
        it('should have all validations', function (done) {
            Comment.schema.paths.title.options.should.have.property("required");
            Comment.schema.paths.title.options.required.should.equal(true);

            done();
        });
        it('should not return any error on find', function (done) {
            var comment = Comment.find({}).limit(1);
            comment.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# DocTypes', function () {

        it('should have all properties', function (done) {
            DocType.schema.paths.should.have.property("description");

            Object.keys(DocType.schema.paths).length.should.equal(3);

            done();
        });
        it('should have all validations', function (done) {
            DocType.schema.paths.description.options.should.have.property("required");
            DocType.schema.paths.description.options.required.should.equal(true);

            done();
        });
        it('should not return any error on find', function (done) {
            var doType = DocType.find().limit(1);
            doType.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# Gates', function () {
        it('should have all properties', function (done) {

            Gate.schema.paths.should.have.property("terminal");
            Gate.schema.paths.should.have.property("buque");
            Gate.schema.paths.should.have.property("viaje");
            Gate.schema.paths.should.have.property("contenedor");
            Gate.schema.paths.should.have.property("mov");
            Gate.schema.paths.should.have.property("tipo");
            Gate.schema.paths.should.have.property("carga");
            Gate.schema.paths.should.have.property("patenteCamion");
            Gate.schema.paths.should.have.property("tren");
            Gate.schema.paths.should.have.property("gateTimestamp");
            Gate.schema.paths.should.have.property("turnoInicio");
            Gate.schema.paths.should.have.property("turnoFin");

            Object.keys(Gate.schema.paths).length.should.equal(14);

            done();
        });
        it('should not return any error on find', function (done) {
            var gate = Gate.find().limit(1);
            gate.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# Invoices', function () {
        it('should have all properties', function (done) {

            var properties = [
                "terminal",
                "codTipoComprob",
                "nroPtoVenta",
                "nroComprob",
                "codTipoAutoriz",
                "codAutoriz",
                "codTipoDoc",
                "nroDoc",
                "clientId",
                "razon",
                "importe.gravado",
                "importe.noGravado",
                "importe.exento",
                "importe.iva",
                "importe.subtotal",
                "importe.otrosTributos",
                "importe.total",
                "codMoneda",
                "cotiMoneda",
                "observa",
                "codConcepto",
                "fecha.emision",
                "fecha.vcto",
                "fecha.desde",
                "fecha.hasta",
                "fecha.vctoPago",
                "detalle",
                "otrosTributos",
                "estado",
                "comment",
                "invoiced"
            ];

            properties.forEach(function (property) {
                Invoice.schema.paths.should.have.property(property);
            });

            Object.keys(Invoice.schema.paths).length.should.equal(properties.length + 2);

            done();
        });
        it('should not return any error on find', function (done) {
            var invoice = Invoice.find().limit(1);
            invoice.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# MatchPrices', function () {
        it('Should have all properties', function (done) {

            MatchPrice.schema.paths.should.have.property("terminal");
            MatchPrice.schema.paths.should.have.property("code");
            MatchPrice.schema.paths.should.have.property("match");
            MatchPrice.schema.paths.should.have.property("price");

            Object.keys(MatchPrice.schema.paths).length.should.equal(6);

            done();
        });
        it('should not return any error on find', function (done) {
            var matchPrice = MatchPrice.find().limit(1);
            matchPrice.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# Prices', function () {
        it('Should have all properties', function (done) {

            Price.schema.paths.should.have.property("terminal");
            Price.schema.paths.should.have.property("code");
            Price.schema.paths.should.have.property("description");
            Price.schema.paths.should.have.property("unit");
            Price.schema.paths.should.have.property("matches");
            Price.schema.paths.should.have.property("topPrices");

            var topPrices = (Price.schema.paths.topPrices instanceof mongoose.Types.DocumentArray);
            topPrices.should.be.true;

            Object.keys(Price.schema.paths).length.should.equal(8);

           done();
        });
        it('should not return any error on find', function (done) {
            var price = Price.find().limit(1);
            price.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# Roles', function () {
        it('Should have all properties', function (done) {

            Role.schema.paths.should.have.property("name");
            Role.schema.paths.should.have.property("level");
            Role.schema.paths.should.have.property("tasks");

            Object.keys(Role.schema.paths).length.should.equal(5);

            done();
        });
        it('should not return any error on find', function (done) {
            var role = Role.find().limit(1);
            role.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# States', function () {
        it('should have all properties', function (done) {

            State.schema.paths.should.have.property("name");
            State.schema.paths.should.have.property("description");
            State.schema.paths.should.have.property("type");

            Object.keys(State.schema.paths).length.should.equal(5);

            done();
       });
        it('should not return any error on find', function (done) {
            var state = State.find().limit(1);
            state.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# Tasks', function () {
        it('should have all properties', function (done) {
            Task.schema.paths.should.have.property("description");
            Task.schema.paths.should.have.property("role");
            Task.schema.paths.should.have.property("route");

            Object.keys(Task.schema.paths).length.should.equal(5);

            done();
        });
        it('should have all validations', function (done) {
            Task.schema.paths.description.options.should.have.property("required");
            Task.schema.paths.description.options.required.should.equal(true);

            done();
        });
        it('should not return any error on find', function (done) {
            var task = Task.find().limit(1);
            task.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# UnitTypes', function () {
        it('should have all properties', function (done) {

            UnitType.schema.paths.should.have.property("description");

            Object.keys(UnitType.schema.paths).length.should.equal(3);

            done();
        });
        it('should not return any error on find', function (done) {
            var unitType = UnitType.find().limit(1);
            unitType.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });

    describe('# VoucherTypes', function () {
       it('should have all properties', function (done) {

           VoucherType.schema.paths.should.have.property("description");

           Object.keys(VoucherType.schema.paths).length.should.equal(3);
           done();
       });
        it('should not return any error on find', function (done) {
            var voucherType = VoucherType.find().limit(1);
            voucherType.exec(function (err, data) {
                should.not.exist(err);

                done();
            });
        });
    });



});