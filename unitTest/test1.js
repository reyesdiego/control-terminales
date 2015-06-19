/**
* Created by diego on 11/06/15.
*/

var should = require('should');

describe('Array', function () {
    'use strict';
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function (done) {
            [1, 2, 3, 9].indexOf(5).should.equal(-1);
            [1, 2, 3].indexOf(0).should.equal(-1);
            done();
        });
        it('should return "B" when the word start with B', function (done) {
            "Bueno".substr(0, 1).should.equal("B");
            "Baueno".substr(0, 1).should.equal("B");
            done();
        });

    });

});