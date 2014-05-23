var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
var log_stdout = process.stdout;

console.log = function(d) { //
	log_file.write(util.format(d) + '\n');
	log_stdout.write(util.format(d) + '\n');
};

console.log("Iniciado...")

setInterval(function(){
	console.log((new Date()).toString());
},5000);


//	setTimeout(function(){
//		throw Error("puto");
//	},10000);

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});
