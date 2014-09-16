var soap = require('soap');

var url = 'https://api.authorize.net/soap/v1/Service.asmx?WSDL';

soap.createClient(url, function(err, client) {

	var args = {
		merchantAuthentication: {
			name: '285tUPuS',
			transactionKey: '58JKJ4T95uee75wd'
		}
	};

	client.Service.ServiceSoap12.GetTransactionDetails(args,
		function(err, result) {

			if (err) {
				console.log(err);
			} else {
				console.log(result.GetTransactionDetailsResult[0].messages);
			}
		});
});