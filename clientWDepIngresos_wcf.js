
var request = '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
	'<soap:Body>'+
	'	<WdepIngresos xmlns="ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos">'+
	'		<argAutentica>'+
	'			<Cuit></Cuit>'+
	'			<TipoAgente></TipoAgente>'+
	'			<Rol></Rol>'+
	'		</argAutentica>'+
	'		<argwdepIngresos>'+
	'			<Carga>'+
	'				<IdDeposito></IdDeposito>'+
	'				<NomMatMedio></NomMatMedio>'+
	'				<IdDeclaracion></IdDeclaracion>'+
	'				<TituloTransporte></TituloTransporte>'+
	'				<NroSalida></NroSalida>'+
	'				<CierreIngreso></CierreIngreso>'+
	'				<LineasMercaderia>'+
	'					<IZPLineaMercaderia xsi:nil="true" />'+
	'					<IZPLineaMercaderia xsi:nil="true" />'+
	'				</LineasMercaderia>'+
	'				<Contenedores>'+
	'					<IZPContenedor xsi:nil="true" />'+
	'					<IZPContenedor xsi:nil="true" />'+
	'				</Contenedores>'+
	'			</Carga>'+
	'		</argwdepIngresos>'+
	'	</WdepIngresos>'+
	'</soap:Body>'+
	'</soap:Envelope>';


var fs = require('fs');

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

proxy.ClientCredentials.ClientCertificate.Certificate =
	fs.readFileSync("certificates/client.key").toString()
proxy.ClientCredentials.ServiceCertificate.DefaultCertificate =
	fs.readFileSync("certificates/server.crt").toString()

proxy.send(message, "ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos/WdepIngresos", function(response, ctx) {
	console.log(response)
});