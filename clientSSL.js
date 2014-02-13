/**
 * Node Client to test the Server
 */

var https = require('https');
var fs = require('fs');

var options = {
	host: 'https://testdia.afip.gov.ar/dia/ws/wdepMovimientos/wdepMovimientos.asmx',
//	port: 5678,
	method: 'POST',
	path: 'ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos/Dummy',
//	key: fs.readFileSync('ssl/client.key'),
//	cert: fs.readFileSync('ssl/client.crt'),
//	passphrase: 'password', // doesn't seem to work...
	headers: {}
};

var req = https.request(options, function(res) {
	console.log(res);
});
req.end();
