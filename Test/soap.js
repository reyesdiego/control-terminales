/**
 * Created by Administrator on 1/14/14.
 */

var soap = require('soap-server');

function MyTestService(){
}
MyTestService.prototype.test2 = function(myArg1, myArg2){
	return myArg1 + myArg2;
};

var soapServer = new soap.SoapServer();
var soapService = soapServer.addService('testService', new MyTestService());

var test2operation = soapService.getOperation('test2');
test2operation.setOutputType('number');
test2operation.setInputType('myArg1', {type: 'number'});
test2operation.setInputType('myArg2', {type: 'number'});

soapServer.listen(1337, '127.0.0.1');