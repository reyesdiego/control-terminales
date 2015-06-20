/**
 * Created by diego on 19/06/15.
 */

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../config/config.js');

var comment = require('../models/comment.js');
var task = require('../models/task.js');
var docType = require('../models/docType.js');

describe('Models', function () {
    'use strict';

    before(function (done) {
        this.timeout(3000);
        mongoose.connect(config.mongo_url);
        mongoose.connection.on('connected', function () {
            done();
        });
    });

    describe('# Comments', function () {
        it('should have all properties', function (done) {
            comment.schema.paths.should.have.property("title");
            comment.schema.paths.description.options.should.have.property("require");
            comment.schema.paths.description.options.require.should.equal(true);
            comment.schema.paths.should.have.property("comment");
            comment.schema.paths.should.have.property("user");
            done();
        });

        it('should return more than 0', function (done) {
            comment.find({}, function (err, data) {
                console.log(data);
                data.length.should.greaterThan(0);
                done();
            });
        });

    });

    describe('# Tasks', function () {
        it('should have all properties', function (done) {
            task.schema.paths.should.have.property("description");
            task.schema.paths.description.options.should.have.property("require");
            task.schema.paths.description.options.require.should.equal(true);
            task.schema.paths.should.have.property("role");
            task.schema.paths.should.have.property("route");
            done();
        });

        it('should return more than 0', function (done) {
            task.find({}, function (err, data) {
                console.log(data);
                data.length.should.greaterThan(0);
                done();
            });
        });

    });

    describe('# DocType', function () {
        it('should have all properties', function (done) {
            docType.schema.paths.should.have.property("description");
            docType.schema.paths.description.options.should.have.property("require");
            docType.schema.paths.description.options.require.should.equal(true);
            done();
        });

        it('should return more than 0', function (done) {
            docType.find({}, function (err, data) {
                console.log(data);
                data.length.should.greaterThan(0);
                done();
            });
        });

    });


});