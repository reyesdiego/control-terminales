/**
 * Created by diego on 12/5/14.
 */

var http = require('http');

var interval = 500; // 1 segundo
var errorCount = 0;
var json = "";
/*
var optionsget = {
	host : process.argv[2], // here only the domain name (no http/https !)
	port : process.argv[3],
	path : '/',
	method : 'GET'
};
*/
var optionsget = {
	host : 'UBUNTUSIS058',
	port : 8080,
	path : '/invoice',
	method : 'POST',
	data : JSON.stringify(json),
	headers: {"Content-Type":"text/plain", token:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InNvcG9ydGVfY3RzQGJhY3Rzc2EuY29tLmFyIn0.bBSqdwesWimlT8rFGA7sKLKbPdxauY8HdrTTt7BLpBU"}
};


var reqGet;

setInterval(request, interval);

function request(){
	reqGet = http.request(optionsget, function(res) {
		if (res.statusCode === 200){
			console.error("OK, statusCode: ", res.statusCode);
			errorCount = 0;
		} else {
			console.log("Se Cayo: ", res.statusCode);
		}

//	console.log("headers: ", res.headers);
		/*
		 res.on('data', function(d) {
		 console.info('GET result:\n');
		 process.stdout.write(d);
		 console.info('\n\nCall completed');
		 });
		 */
	});
	json.nroComprob++;
	reqGet.write(JSON.stringify(json));
	reqGet.end();

	reqGet.on('error', function(e) {

//			process.exit(code=0);

	});
}


var json = {
	"codTipoComprob":1,
	"nroPtoVenta":31,
	"nroComprob":56552,
	"fechaEmision":"2014/03/10",
	"codTipoAutoriz":"k",
	"codAutoriz":64105928828924,
	"fechaVcto":"2014/04/09",
	"codTipoDoc":"080",
	"nroDoc":30678191805,
	"clienteId":602233,
	"razon":"ARCOR S.A.I.C.",
	"impGrav":5852.9,
	"impNoGrav":0.0,
	"impExento":null,
	"impSubtot":5852.9,
	"impOtrosTrib":1556.28,
	"impIva":0.0,
	"impTotal":7409.18,
	"codMoneda":"DOL",
	"cotiMoneda":8.4,
	"observa":null,
	"codConcepto":null,
	"fechaServDesde":"2014/03/10",
	"fechaServHasta":"2014/03/10",
	"fechaVctoPago":"2014/03/10",
	"otrosTributos":
		[
			{
				"id":"IIBB6",
				"desc":"PERC BS AS RI",
				"imponible":0.06,
				"imp":327.17
			},
			{
				"id":"IVA21",
				"desc":"IVA 21%",
				"imponible":0.21,
				"imp":1229.11
			}
		],
	"detalle":
		[
			{
				"contenedor":"ISCU1234567",
				"fecha":"2014/03/10",
				"buqueDesc":"TITANIC",
				"viaje":"23",
				"items":
					[
						{
							"id":"EXST0",
							"cnt":1,
							"uniMed":5,
							"impUnit":0.04116,
							"impTot":4.1160000000000005
						}
					]
			},
			{
				"contenedor":"MAXI1234567",
				"buqueId":"758",
				"fecha":"2014/03/10",
				"buqueDesc":"TITANIC",
				"viaje":"23",
				"items":
					[
						{
							"id":"EXST1",
							"cnt":2,
							"uniMed":5,
							"impUnit":2,
							"impTot":4
						}
					]
			}
		]
}
