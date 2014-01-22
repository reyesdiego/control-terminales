/**
 * Created by Administrator on 1/14/14.
 */

var soap = require("soap");
var url = 'http://127.0.0.1:1337/testService?wsdl';
var args = {myArg1: 1, myArg2: 1};
soap.createClient(url, function(err, client) {
	client.test2(args, function(err, result) {
		console.log(result);
	});
});
