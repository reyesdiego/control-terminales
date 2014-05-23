

console.log("Iniciado...")



	setTimeout(function(){
		throw Error("puto");
	},7000);

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});
