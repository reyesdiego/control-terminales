/**
 * Created by Administrator on 2/11/14.
 */

//Include the https & file system modules
var https = require('https');
var fs = require('fs');

//Create the server options object, specifying the SSL key & cert
var options = {
	key: fs.readFileSync('privatekey.pem'),
	cert: fs.readFileSync('certificate.pem'),

	// Ask for the client's cert
	requestCert: true,
	// Don't automatically reject
	rejectUnauthorized: false
};

//Create the HTTPS enabled server - listening on port 8000
https.createServer(options, function (req, res) {
	res.writeHead(200);
	res.end("hello world\n");
}).listen(8080, function() {});