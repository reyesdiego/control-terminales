/**
 * Created by Diego Reyes on 2/25/14.
 */

var async = require('async');

var cnt = [10,2,3,4,5];

async.forEach(cnt, function(cntItem, callback){
	console.log("forEach Item en stack asynchronic %s", cntItem);
	var f = setTimeout(function(){
			console.log("Item en stack asynchronic %s", cntItem);
			callback();
		}, cntItem * 1000);
}, function(err){
	console.log(err);
});


