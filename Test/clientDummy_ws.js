//var BasicHttpBinding = require('wcf.js').BasicHttpBinding
//	, Proxy = require('wcf.js').Proxy
//	, binding = new BasicHttpBinding()
//	, proxy = new Proxy(binding, "https://testdia.afip.gov.ar/dia/ws/wdepMovimientos/wdepMovimientos.asmx")
//	, message = '<?xml version="1.0" encoding="utf-8"?>'+
//		'<Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
//		'<Body>'+
//		'<Dummy xmlns="ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos" />'+
//		'</Body>'+
//		'</Envelope>';
//
//proxy.send(message, "http://tempuri.org/IService/GetData", function(response, ctx) {
//	console.log(response)
//});

var et = require('elementtree');

var ws = require('ws.js')

var request = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soap:Body><Dummy xmlns="ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos" /></soap:Body></soap:Envelope>';

//request = "<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
//	<soap:Body>
//		<WdepIngresos xmlns="ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos">
//			<argAutentica>
//				<Cuit>string</Cuit>
//				<TipoAgente>string</TipoAgente>
//				<Rol>string</Rol>
//			</argAutentica>
//			<argwdepIngresos>
//				<Carga>
//					<IdDeposito>string</IdDeposito>
//					<NomMatMedio>string</NomMatMedio>
//					<IdDeclaracion>string</IdDeclaracion>
//					<TituloTransporte>string</TituloTransporte>
//					<NroSalida>string</NroSalida>
//					<CierreIngreso>string</CierreIngreso>
//					<LineasMercaderia>
//						<IZPLineaMercaderia xsi:nil="true" />
//						<IZPLineaMercaderia xsi:nil="true" />
//					</LineasMercaderia>
//					<Contenedores>
//						<IZPContenedor xsi:nil="true" />
//						<IZPContenedor xsi:nil="true" />
//					</Contenedores>
//				</Carga>
//			</argwdepIngresos>
//		</WdepIngresos>
//	</soap:Body>
//	</soap:Envelope>"

var etree = et.parse(request);

console.log("response: " + etree.find('.//Dummy'));


var ctx =  { request: request
	, url: "https://testdia.afip.gov.ar/dia/ws/wdepMovimientos/wdepMovimientos.asmx"
	, action: "ar.gov.afip.dia.serviciosweb.wdepMovimientos.wdepMovimientos/Dummy"
	, contentType: "text/xml"
}


var handlers =  [ new ws.Addr("https://testdia.afip.gov.ar")
	, new ws.Http()
]

ws.send(handlers, ctx, function(ctx) {
	console.log("response: " + ctx.response);
})
