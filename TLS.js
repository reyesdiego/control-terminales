var tls = require('tls');
var fs = require('fs');

if (1===1) {
var options = {
	key: fs.readFileSync('certificates/server.key'),
	cert: fs.readFileSync('certificates/server.crt'),

	// Merge 1 This is necessary only if using the client certificate authentication.
	requestCert: true,

	console.log("Testing Merge 1");
	ca: [ fs.readFileSync('certificates/ca.crt') ]
};
var server = tls.createServer(options, function(cleartextStream) {

	console.log('server connected',
		cleartextStream.authorized ? 'authorized' : 'unauthorized');
	cleartextStream.write("welcome!\n");
	cleartextStream.setEncoding('utf8');
	cleartextStream.pipe(cleartextStream);

	
});
//Branch1
if (2===2){
	server.listen(8000, function() {
		console.log('server bound');
	});
}
}

console.log("Testing Merge");
