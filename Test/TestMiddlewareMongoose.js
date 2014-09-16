/**
 * Created by diego on 9/15/14.
 */
/**
 * Created by diego on 9/12/14.
 */
var mongoose = require('mongoose');
var schema = mongoose.Schema;

var async = require('async');

var Role = require('../models/role.js');

console.log('Running mongoose version %s', mongoose.version);

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 */

//mongoose.connect('mongodb://localhost/terapi', function (err) {
mongoose.connect('mongodb://localhost/terapi', {
	user: 'admin',
	pass: 'desarrollo',
	auth: { authdb:"admin" }
}, function (err) {

	if (err) throw err;

	console.log("Connected");
	insert();

})


function insert() {


	var role = Role.find({}).limit(1);
	role.exec (function (err, role){
		var roleItem = role[0];
		console.log(roleItem);
		roleItem.level = 2;
		roleItem.save( function (err, saved) {
			if (err)
				console.log(err);
			else
				console.log(saved);

		});
	});


}
