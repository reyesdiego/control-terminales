/**
 * Created by diego on 2/2/16.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../config/config.js');

var Account = require('../models/account.js');

describe('Classes', function () {
    'use strict';

    before(function (done) {
        this.timeout(30000);
        mongoose.connect(config.mongo_url, config.mongo_opts);
        mongoose.connection.on('connected', function () {
            done();
        });

    });

    describe('Gate', function () {
        it('should exists class Gate', function (done) {
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.toString().length.should.greaterThan(0);
            done();
        });

        it('should exists method getByHour', function (done) {
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.getByHour({}, function (err, data) {
                done();
            });
        });

        it('should exists method getByMonth', function (done) {
            var Gate = require('../lib/gate.js');
            Gate = new Gate();
            Gate.getByMonth({}, function (err, data) {
                done();
            });
        });

    });
});