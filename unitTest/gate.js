/**
 * Created by diego on 2/2/16.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../config/config.js');

var Account = require('../models/account.js');

describe('Classes', function () {
    'use strict';
    var oracle;

    before(function (done) {
        this.timeout(30000);
        mongoose.connect(config.mongo_url, config.mongo_opts);
        mongoose.connection.on('connected', function () {

            oracle = require('../include/oracle.js');
            oracle = new oracle();
            oracle.oracledb.maxRows = 5000;
            oracle.oracledb.createPool(
                //{
                //    user          : "HR",
                //    password      : "oracle_4U",
                //    connectString : "(DESCRIPTION = " +
                //        "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.10.0.226)(PORT = 1521)) " +
                //        "(CONNECT_DATA = " +
                //        "        (SID = ORCL) " +
                //        ") " +
                //        ")",
                //    poolMax       : 50,
                //    poolMin       : 2,
                //    poolIncrement : 5,
                //    poolTimeout   : 4,
                //},
                {
                    user: "afip",
                    password: "afip_",
                    connectString: "(DESCRIPTION = " +
                    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
                    "(CONNECT_DATA = " +
                    "        (SID = AFIP) " +
                    ") " +
                    ")",
                    poolMax: 50,
                    poolMin: 2,
                    poolIncrement: 5,
                    poolTimeout: 4,
                },
                function (err, pool) {

                    oracle.pool = pool;

                    done();

                });

        });

    });

    describe('Gate MongoDB', function () {

        it('should exists class Gate', function (done) {
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.toString().length.should.greaterThan(0);
            done();
        });

        it('should exists method getGates', function (done) {
            var param;
            this.timeout(10000);

            param = {
                skip: 0,
                limit: 15
            }
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.getGates(param, function (err, data) {
                console.log("DATA %j ", data);
                data.should.not.have.property("length");
                data.should.have.property("status");
                data.status.should.equal("OK");
                console.log("DATA COUNT %d ", data.totalCount);
                done();
            });
        });

        it('should exists method getByHour', function (done) {
            this.timeout(10000);
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.getByHour({}, function (err, data) {
                data.should.have.property("length");
                done();
            });
        });

        it('should exists method getByMonth', function (done) {
            this.timeout(10000);
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.getByMonth({}, function (err, data) {
                data.should.have.property("length");
                done();
            });
        });

    });

    describe('Gate Oracle', function () {

        it('should exists class Gate', function (done) {
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.toString().length.should.greaterThan(0);
            done();
        });

        it('should exists method getGates', function (done) {
            var param;
            this.timeout(10000);

            param = {
                skip: 0,
                limit: 15,
                order: '[{"terminal": -1}]'
            }
            var Gate = require('../lib/gate.js');
            Gate = new Gate(oracle);
            Gate.getGates(param, function (err, data) {
                if (err) {
                    err.should.have.property("status");
                    err.status.should.equal("OK");
                } else {
                    console.log("DATA %j ", data);
                    data.should.not.have.property("length");
                    data.should.have.property("status");
                    data.status.should.equal("OK");
                    console.log("DATA COUNT %d ", data.totalCount);
                }
                done();
            });
        });

        it('should exists method getByHour', function (done) {
            this.timeout(10000);
            var Gate = require('../lib/gate.js');
            Gate = new Gate(oracle);
            Gate.getByHour({}, function (err, data) {
                data.should.have.property("length");
                done();
            });
        });

        it('should exists method getByMonth', function (done) {
            this.timeout(10000);
            var Gate = require('../lib/gate.js');
            Gate = new Gate(oracle);
            Gate.getByMonth({}, function (err, data) {
                data.should.have.property("length");
                console.log(data);
                done();
            });
        });

    });

    describe('Price MongoDB', function () {
        var Price = require('../lib/price.js');

        it('should exists class Price', function (done) {
            let price = new Price();
            price.toString().length.should.greaterThan(0);
            done();
        });

        it('should exists method rates', function (done) {
            this.timeout(10000);

            let price = new Price();
            price.rates(true, function (err, data) {
                data.should.not.have.property("length");
                console.log(data);
                done();
            });
        });

        it('should exists method ratePrices', function (done) {
            this.timeout(10000);

            let price = new Price("TRP");
            price.ratePrices('2015-08-01',  function (err, data) {
                data.should.have.property("length");
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                }
                done();
            });
        });

        it('should exists method getRates', function (done) {
            this.timeout(10000);

            let price = new Price();
            price.getRates(function (err, data) {
                data.should.have.property('status');
                data.status.should.be.equal('OK');
                console.log(data);
                done();
            });
        });

        it('should exists method getPrice and must return ERROR', function (done) {
            this.timeout(10000);

            let price = new Price();
            var id = "53728131c48d4434587bd9ae";
            price.getPrice(id, function (err, data) {
                err.should.have.property('status');
                err.status.should.be.equal('ERROR');
                console.log(err);
                done();
            });
        });

        it('should exists method getPrice and must return OK', function (done) {
            this.timeout(10000);

            let price = new Price("TRP");
            var id = "53728131c48d4434587bd9ae";
            price.getPrice(id, function (err, data) {
                console.log(data);
                data.should.have.property('status');
                data.status.should.be.equal('OK');
                done();
            });
        });

        it('should exists method getPrices and must return ERROR no terminal passed', function (done) {
            this.timeout(10000);

            let price = new Price();
            var id = "53728131c48d4434587bd9ae";
            price.getPrice(id, function (err, data) {
                err.should.have.property('status');
                err.status.should.be.equal('ERROR');
                done();
            });
        });

        it('should exists method getPrices and must return OK only 1 row', function (done) {
            this.timeout(10000);

            var param = {};
            let price = new Price("TRP");

            param.code = "TCI";
            //param.rate = {$exists: true};

            price.getPrices(param, function (err, data) {
                if (err) {
                    console.log(err);
                    data.status.should.be.equal('OK');
                } else {
                    console.log("DATA %j: ", data);
                    data.should.have.have.property('status');
                    data.status.should.be.equal('OK');
                    data.data.should.have.property('length');
                    data.data.length.should.be.equal(1);
                }
                done();
            });
        });

        it('should exists method getPrices and must return OK only rates TRP', function (done) {
            this.timeout(10000);
            var param = {};
            var price = new Price("TRP");

            param.onlyRates = true;

            price.getPrices(param, function (err, data) {
                if (err) {
                    console.log(err);
                    data.status.should.be.equal('OK');
                } else {
                    console.log("DATA %j: ", data);
                    data.should.have.have.property('status');
                    data.status.should.be.equal('OK');
                    data.data.should.have.property('length');
                }
                done();
            });
        });

        it('should exists method getPrices and must return OK only TRP = 490', function (done) {
            this.timeout(10000);
            var param = {};
            var price = new Price("TRP");

            price.getPrices(param, function (err, data) {
                if (err) {
                    console.log(err);
                    data.status.should.be.equal('OK');
                } else {
                    console.log("DATA COUNT %d", data.data.length);
                    console.log("DATA[0] %j", data.data[0]);
                    data.should.have.have.property('status');
                    data.status.should.be.equal('OK');
                    data.data.should.have.property('length');
                    data.data.length.should.be.equal(490);
                }
                done();
            });
        });

        it('should exists method getPrices and must return ERROR all TRP no terminal passed', function (done) {
            this.timeout(10000);
            var param = {};
            let price = new Price();

            price.getPrices(param, function (err, data) {
                if (err) {
                    console.log("ERROR %j", err);
                    err.should.have.have.property('status');
                    err.status.should.be.equal('ERROR');
                    done();
                }
            });
        });

    });

    describe('Price Oracle', function () {
        var Price = require('../lib/price.js');

        it('should exists class Price', function (done) {
            let price = new Price(oracle);
            price.toString().length.should.greaterThan(0);
            done();
        });

        it('should exists method rates', function (done) {
            this.timeout(10000);

            let price = new Price(oracle);
            price.rates(true, function (err, data) {
                data.should.not.have.property("length");
                console.log(data);
                done();
            });
        });

        it('should exists method ratePrices', function (done) {
            this.timeout(10000);

            let price = new Price("TRP", oracle);
            price.ratePrices('2015-08-01',  function (err, data) {
                data.should.have.property("length");
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                }
                done();
            });
        });

        it('should exists method getRates', function (done) {

            let price = new Price(oracle);
            price.getRates(function (err, data) {
                data.should.have.property('status');
                data.status.should.be.equal('OK');
                console.log(data);
                done();
            });
        });

        it('should exists method getPrice and must return ERROR', function (done) {
            let price = new Price(oracle);
            var id = 2503785;
            price.getPrice(id, function (err, data) {
                err.should.have.property('status');
                err.status.should.be.equal('ERROR');
                console.log(err);
                done();
            });
        });

        it('should exists method getPrice and must return OK', function (done) {
            let price = new Price("TRP", oracle);
            var id = 2503785;
            price.getPrice(id, function (err, data) {
                data.should.have.property('status');
                data.status.should.be.equal('OK');
                console.log(data);
                done();
            });
        });

        it('should exists method getPrices and must return OK only 1 row', function (done) {
            this.timeout(10000);

            let price = new Price("TRP", oracle),
                param = {};

            param.code = "TCI";

            price.getPrices(param, function (err, data) {
                if (err) {
                    console.log(err);
                    err.should.have.have.property('status');
                    err.status.should.be.equal('OK');
                } else {
                    console.log("DATA %j ", data);
                    data.should.have.have.property('status');
                    data.status.should.be.equal('OK');
                    data.data.should.have.property('length');
                    data.data.length.should.be.equal(1);
                }
                done();
            });
        });

        it('should exists method getPrices and must return OK only rates ', function (done) {
            this.timeout(10000);

            let price = new Price("TRP", oracle);
            var param = {};

            param.onlyRates = true;

            price.getPrices(param, function (err, data) {
                console.log("DATA %j", data);
                data.should.have.have.property('status');
                data.status.should.be.equal('OK');
                data.data.should.have.property('length');
                done();
            });
        });

        it('should exists method getPrices and must return OK only TRP = 483', function (done) {
            this.timeout(10000);
            let param = {};
            let price = new Price("TRP", oracle);

            price.getPrices(param, function (err, data) {
                if (err) {
                    console.log("ERROR %j:", err);
                    data.status.should.be.equal('OK');
                } else {
                    console.log("DATA COUNT %j", data.data.length);
                    console.log("DATA[0] %j", data.data[0]);
                    data.should.have.have.property('status');
                    data.status.should.be.equal('OK');
                    data.data.should.have.property('length');
                }
                done();
            });
        });

        it('should exists method getPrices and must return ERROR all TRP no terminal passed', function (done) {
            this.timeout(10000);
            let param = {};
            let price = new Price(oracle);

            price.getPrices(param, function (err, data) {
                if (err) {
                    console.log(err);
                    err.should.have.have.property('status');
                    err.status.should.be.equal('ERROR');
                    done();
                }
            });
        });

    });

    describe('Invoice Oracle', function () {
        var Invoice = require('../lib/invoice2.js');

        it('should exists class Invoice', function (done) {
            var invoice = new Invoice(oracle);
            console.log(invoice.toString());
            invoice.toString().length.should.greaterThan(0);
            done();
        });

        it('should exists method getInvoice and must returns OK ID=2506605 on TERMINAL4', function (done) {
            var param = {
                _id: 2506605,
                terminal: "TERMINAL4"
            };
            var invoice = new Invoice(oracle);

            invoice.getInvoice(param, function (err, data) {
                if (err) {
                    console.log("ERROR %j", err);
                    err.should.have.property('status');
                    err.status.should.be.equal('OK');
                } else {
                    console.log("DATA %j", data);
                    data.should.have.property('status');
                    data.status.should.be.equal('OK');
                }
                done();
            });
        });

        it('should exists method getInvoices and must returns OK only TRP', function (done) {
            var param = {
                terminal: "TERMINAL4",
                skip: 0,
                limit: 15
            };
            var invoice = new Invoice(oracle);

            invoice.getInvoices(param, function (err, data) {
                if (err) {
                    console.log("ERROR %j", err);
                    err.should.have.property('status');
                    err.status.should.be.equal('OK');
                } else {
                    console.log("DATA %j", data);
                    data.should.have.property('status');
                    data.status.should.be.equal('OK');
                }
                done();
            });
        });

    });

    describe('Invoice MongoDB', function () {
        var Invoice = require('../lib/invoice2.js');

        it('should exists class Invoice', function (done){
            var invoice = new Invoice();
            console.log(invoice.toString());
            invoice.toString().length.should.greaterThan(0);
            done();
        });

        it('should exists method getInvoice and must returns OK only 1 row', function (done) {
            var param = {
                _id: "56c5a1dbb5163b4d5f00b026",
                terminal: "TERMINAL4"
            };
            var invoice = new Invoice();

            invoice.getInvoice(param, function (err, data) {
                console.log("DATA %j", data);
                data.should.have.property('status');
                data.status.should.be.equal('OK');
                done();
            });
        });

        it('should exists method getInvoices and must returns OK only TRP', function (done) {
            var param = {
                terminal: "TRP",
                skip: 0,
                limit: 15
            };
            var invoice = new Invoice();

            invoice.getInvoices(param, function (err, data) {
                console.log("DATA %j", data);
                data.should.have.property('status');
                data.status.should.be.equal('OK');
                done();
            });
        });

    });
});