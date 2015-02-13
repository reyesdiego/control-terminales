/**
 * Created by diego on 2/11/15.
 */
var mongoose = require('mongoose');
var schema = mongoose.Schema;

var async = require('async');

var Invoice = require('./../models/invoice.js');
var Comment = require('./../models/comment.js');

console.log('Running mongoose version %s', mongoose.version);

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 */

//mongoose.connect('mongodb://localhost/terapi', function (err) {
mongoose.connect('mongodb://10.1.0.51/terapi', {
	user: 'admin',
	pass: 'Pt trend 54',
	auth:{authdb:"admin"}
}, function (err) {

	if (err) throw err;
	console.log("Connected");
	getData();
})


function getData() {

	var _Comment = Comment.find({});
	_Comment.exec(function (err, comments){

		async.forEachSeries( comments, function(comment, asyncCallback){

			Invoice.findOne({_id: comment.invoice}, function (err, invoice){

					if (invoice == null){
						Comment.remove({_id: comment._id}, function (err, commentDel){
							asyncCallback();
						});
					} else {
						asyncCallback();
					}
			});
		}, done);
	});
}

function done(){
	console.log("terminó..");
	mongoose.connection.close(function () {
		console.log("Mongoose conexión cerrada normalmente.");
	});
}
