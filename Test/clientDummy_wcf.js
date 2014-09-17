
var request = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soap:Body><Dummy xmlns="ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos" /></soap:Body></soap:Envelope>';

var BasicHttpBinding = require('wcf.js').BasicHttpBinding
	, Proxy = require('wcf.js').Proxy
	, binding = new BasicHttpBinding(
		{ SecurityMode: "TransportWithMessageCredential"
			, MessageClientCredentialType: "UserName"
		})
	, proxy = new Proxy(binding, "https://testdia.afip.gov.ar/dia/ws/wdepMovimientos/wdepMovimientos.asmx")
	, message =  request;

//proxy.ClientCredentials.Username.Username = "yaron"
//proxy.ClientCredentials.Username.Password = "1234"

proxy.send(message, "ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos/Dummy", function(response, ctx) {
	console.log(response)
});