var mongoose = require('mongoose');
var schema = mongoose.Schema;

var async = require('async');

var price = require('./models/price.js');
var matchprice = require('./models/matchPrice.js');

var T4Sch = schema({
	MATCH : {type: String},
	CODE : {type: String}
})

var T4 = mongoose.model('tcuatros', T4Sch);

console.log('Running mongoose version %s', mongoose.version);

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 */

//mongoose.connect('mongodb://localhost/terapi', function (err) {
//
//	if (err) throw err;
//
//	getData();
//})


function getData() {

	T4.find({}, function (err, data){

		async.forEachSeries( data, function(item, asyncCallback){

			price.findOne({terminal:"TERMINAL4", code: item.CODE}, function (err, pric){

				if (pric != null){
					matchprice.findOne({terminal:"TERMINAL4", code: item.CODE}, function (err, mp){
						if (mp !== undefined && mp != null){
							console.log("MODIFICO", item.CODE);
							mp.match.push(item.MATCH);
							mp.save(function (){
								asyncCallback();
							})
						} else {
							console.log("CREO NUEVO", item.CODE);
							var mpNew = new matchprice({
								terminal:"TERMINAL4",
								code: item.CODE,
								match: [item.MATCH],
								price: pric._id
							});
							mpNew.save(function (err, mpNew){
								if (pric.matches == null)
									pric.matches = [];

								pric.matches.push(mpNew._id);
								pric.save(function (er, p){
									asyncCallback();
								})
							});
						}
					});
				} else {
					asyncCallback();
				}
			});

//			price.findOne({terminal:"AGP", code: item.CODE }, function (err, pri) {
//				console.log(pri);
//				asyncCallback();
//			} );

		});

	});
}

function done (err) {
	if (err) console.error(err);
	Console.remove(function () {
		Game.remove(function () {
			mongoose.disconnect();
		})
	})
}
