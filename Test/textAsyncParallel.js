/**
 * Created by diego on 1/22/15.
 */

var async = require('async');

var cashes = [];
for (var i= 0; i<4; i++){
	var cash = 	function(callback){
		setTimeout(function(){
			console.log('cual:%s', i.toString());
			callback(null, i.toString());
		}, 1000 * i);
	};
	cashes.push(cash);
}


	async.parallel(
		cashes
	,
// optional callback
	function(err, results){
		console.log("TERMINO");
		// the results array will equal ['one','two'] even though
		// the second function had a shorter timeout.
	});