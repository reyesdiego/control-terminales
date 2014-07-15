/**
 * Created by diego on 7/15/14.
 */

var ActiveDirectory = require('activedirectory');
var ad = new ActiveDirectory({ url: 'ldap://10.0.0.56:389',
	baseDN: 'dc=ptobaires,dc=gov,dc=ar'});


var processArgs = process.argv.slice(2);

ad.authenticate(processArgs[0], processArgs[1], function(err, auth) {
	if (err) {
		console.log('ERROR: '+JSON.stringify(err));
		return;
	}

	if (auth) {
		console.log('Authenticated!');
	}
	else {
		console.log('Authentication failed!');
	}
});