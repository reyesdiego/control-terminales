/**
 * Created by diego on 11/06/15.
 */

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');

describe('Agp Api', function() {
	var url = 'http://localhost:8080';
	// within before() you can run all the operations that are needed to setup your tests. In this case
	// I want to create a connection with the database, and when I'm done, I call done().
	before(function(done) {
		// In our tests we use the test db
//		mongoose.connect(config.db.mongodb);
		done();
	});
	// use describe to give a title to your test suite, in this case the tile is "Account"
	// and then specify a function in which we are going to declare all the tests
	// we want to run. Each test starts with the function it() and as a first argument
	// we have to provide a meaningful title for it, whereas as the second argument we
	// specify a function that takes a single parameter, "done", that we will use
	// to specify when our test is completed, and that's what makes easy
	// to perform async test!
	describe('Route', function() {
		it('should return error if / route not exists', function(done) {

			request(url)
				.get('/')
				.expect(200)
				.expect('Content-Type', /text\/html/)
				// end handles the response
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					// this is should.js syntax, very clear
//					res.should.have.status(200);
					done();
				});
		});

		it('should return error if /json route not exist and has not a:1 and b:1', function(done){

			request(url)
				.get('/json')
				.expect('Content-Type', /json/)
				.expect(200) //Status code
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					// Should.js fluent syntax applied
					res.body.should.have.property('a');
					res.body.a.should.equal(1);
					res.body.b.should.equal(1);
//					res.body.creationDate.should.not.equal(null);
					done();
				});
		});

	});
});