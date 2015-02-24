/**
 * Created by diego on 2/23/15.
 */

var Enumerable = require("linq");

/*
var cliente = [
	{
		name : "Diego",
		localidad : "CABA"
	},
	{
		name : "Arti",
		localidad : "CABA"
	},
	{
		name : "Leo",
		localidad : "Tap"
	},
	{
		name : "Pepe",
		localidad : "CABA"
	}
];

var localidades = [
	{nombre : "CABA", id: "CABA"},
	{nombre: "Tapiales", id: "Tap"}
]


var response = [];

var i = Enumerable.from(cliente)
	.groupBy(function (item){
		return item.localidad;
	}, function (item){
		return item
	},
		function (item, g){
			response.push({localidad : item,
							total : g.count()})
		}
).toArray();

console.log(response);


var response = Enumerable.from(cliente)
	.where('$.localidad == "CABA"')
	.join(Enumerable.from(localidades), '$.localidad', '$.id', function (cliente, localidad){
		var pp = {cliente: cliente.name,
			localidad: localidad.nombre};
		return pp;
	}
).orderBy('$.cliente')
	.toArray();

console.log(response);
*/
/////////////////////////////////////////////////////////////

var counts = [
	{
		"codTipoComprob": 1,
		"total": 875,
		"TERMINAL4": [
			287,
			32.8
		],
		"TRP": [
			588,
			67.2
		]
	},
	{
		"codTipoComprob": 3,
		"total": 2,
		"TRP": [
			2,
			100
		]
	},
	{
		"codTipoComprob": 6,
		"total": 2,
		"TRP": [
			2,
			100
		]
	}
];

////////////PONER ESTO////////////////////
//esto devuelve el socket
var cnt = {
	codTipoComprob : 1,
	terminal:"TRP"
};

var response = Enumerable.from(counts)
	.where('$.codTipoComprob=='+cnt.codTipoComprob)
	.toArray();

console.log('Count $j', response);

response[0].total++;
response[0][cnt.terminal][0]++;

for (var obj in response[0]){
	if (typeof response[0][obj] === 'object'){
		response[0][obj][1] = response[0][obj][0] * 100 / response[0].total;
	}
}

console.log('Count Sumado $j', counts);





