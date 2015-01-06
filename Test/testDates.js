/**
 * Created by diego on 1/6/15.
 */
var mongoose = require('mongoose');
var schema = mongoose.Schema;

var moment = require('moment');

var PPSch = schema({
	date : {type: Date}
})

var PPS = mongoose.model('diegos', PPSch);

console.log('Running mongoose version %s', mongoose.version);

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 */

mongoose.connect('mongodb://localhost/terapi', {
//mongoose.connect('mongodb://10.1.0.51/terapi', {
	user: 'admin',
	pass: 'desarrollo',
	auth:{authdb:"admin"}
}, function (err) {

	if (err)
		console.error(err);
	else;
		console.log("Connected");

	getData();
})


function getData() {

	PPS.find({}, function (err, data){

		data[0].date = moment("2014-12-12").format("YYYY-MM-DD 00:00:00 Z");
		console.log(data);
		data[0].save(function (err, dsaved){
			console.log("modifico %s", dsaved);
			process.exit(0);
		});
	});
}
