/**
 * Created by diego on 11/06/15.
 */

var should = require('should'),
    assert = require('assert'),
    request = require('supertest'),
    mongoose = require('mongoose'),
    config = require('../config/config.js');

describe('AgpApi Rest', function () {
    'use strict';
    var url = 'http://localhost:8080';
    // within before() you can run all the operations that are needed to setup your tests. In this case
    // I want to create a connection with the database, and when I'm done, I call done().
    before(function (done) {
        // In our tests we use the test db
        //mongoose.connect(config.mongo_url, config.mongo_optsl);
        //mongoose.connection.on('connected', function () {
        //    done();
        //});
        done();
    });

    it('/ get | should return error if route not exists', function (done) {

        request(url)
            .get('/')
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
//                    this is should.js syntax, very clear
//                    res.should.have.status(200);
                done();
            });
    });

    describe('Accounts', function () {

        it('/agp/accounts - GET | should return status 403 if does not have token', function (done) {

            request(url)
                .get('/agp/accounts')
                .expect('Content-Type', /json/)
                .expect(403) //Status code
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    // Should.js fluent syntax applied
                    res.body.should.have.property('status');
                    res.body.status.should.equal("ERROR");
                    //res.body.length.should.not.equal(0);
//                    res.body.a.should.equal(1);
//                    res.body.b.should.equal(1);
//                    res.body.creationDate.should.not.equal(null);
                    done();
                });
        });

        it('/login - POST | should return status 200 with user "agp" pass "agp431_" ', function (done) {

            request(url)
                .post('/login')
//                .field('email', 'agp')
                .send({email: "agp", password: "agp431_"})
                .expect('Content-Type', /json/)
                .expect(200) //Status code
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    // Should.js fluent syntax applied
                    res.body.should.have.property('status');
                    res.body.status.should.equal("OK");
                    //res.body.length.should.not.equal(0);
//                    res.body.a.should.equal(1);
//                    res.body.b.should.equal(1);
//                    res.body.creationDate.should.not.equal(null);
                    done();
                });
        });

    });

    describe('Gates', function () {
        describe('/gates/:terminal/:skip/:limit', function () {
            it('GET | should return status 200', function (done) {

                request(url)
                    .get('/gates/BACTSSA/0/10')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('OK');
                        done();
                    });
            });
            it('GET | should return status 403 with token different as to :terminal', function (done) {

                request(url)
                    .get('/gates/TRP/0/10')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });

            });
            it('GET | should return status 403 with token different as to :terminal', function (done) {

                request(url)
                    .get('/gates/TRP/0/10')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });

            });
        });
        describe('/gates/ByHour', function () {
            it('GET | should return status 200', function (done) {

                request(url)
                    .get('/gates/ByHour')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('OK');
                        done();
                    });
            });
            it('GET | should return status 403 if does not have token', function (done) {

                request(url)
                    .get('/gates/ByHour')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });
            });
        });
        describe('/gates/ByMonth', function () {
            it('GET | should return status 200', function (done) {
                request(url)
                    .get('/gates/ByMonth')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('OK');
                        done();
                    });
            });
            it('GET | should return status 403 if does not have token', function (done) {

                request(url)
                    .get('/gates/ByMonth')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });
            });
        });
        describe('/gates/:terminal/missingGates', function () {
            it('GET | should return status 200', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/BACTSSA/missingGates')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('OK');
                        done();
                    });
            });
            it('GET | should return status 403 if does not have token', function (done) {

                request(url)
                    .get('/gates/BACTSSA/missingGates')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });
            });
            it('GET | should return status 403 with token different as to :terminal', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/TRP/missingGates')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });

            });
        });
        describe('/gates/:terminal/missingInvoices', function () {
            it('GET | should return status 200', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/BACTSSA/missingInvoices')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('OK');
                        done();
                    });
            });
            it('GET | should return status 403 if does not have token', function (done) {

                request(url)
                    .get('/gates/BACTSSA/missingInvoices')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });
            });
            it('GET | should return status 403 with token different as to :terminal', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/TRP/missingInvoices')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });

            });
        });
        describe('/gates/:terminal/ships', function () {
            it('GET | should return status 200', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/BACTSSA/ships')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('OK');
                        done();
                    });
            });
            it('GET | should return status 403 if does not have token', function (done) {

                request(url)
                    .get('/gates/BACTSSA/ships')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });
            });
            it('GET | should return status 403 with token different as to :terminal', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/TRP/ships')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });

            });
        });
        describe('/gates/:terminal/containers', function () {
            it('GET | should return status 200', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/BACTSSA/containers')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('OK');
                        done();
                    });
            });
            it('GET | should return status 403 if does not have token', function (done) {

                request(url)
                    .get('/gates/BACTSSA/containers')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });
            });
            it('GET | should return status 403 with token different as to :terminal', function (done) {
                this.timeout(30000);
                request(url)
                    .get('/gates/TRP/containers')
                    .set('token', "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU")
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.should.have.property('status');
                        res.body.status.should.equal('ERROR');
                        done();
                    });

            });
        });
    });
});