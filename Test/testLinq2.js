/**
 * Created by diego on 11/5/14.
 */

var Enumerable = require('linq');

var viajes = [ {
		"buque" : "CARE II",
		"viaje" : "317"
	},
	{
		"buque" : "CARE II",
		"viaje" : "318"
		},
	{
		"buque" : "CCNI PATAGONIA",
		"viaje" : "7E"
		},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D011E"
		},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D035W"
		},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D036E"
		},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D060E"
		}];

var gates = [
	{
		"buque" : "CCNI PATAGONIA",
		"viaje" : "7E",
		"contenedor" : "IMCU1234567"
	},
	{
		"buque" : "CCNI PATAGONIA",
		"viaje" : "7E",
		"contenedor" : "XXXX1234567"
	},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D011E",
		"contenedor" : "AXSW1234567"
	},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D036E",
		"contenedor" : "QAZW1234567"
	},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D036E",
		"contenedor" : "POPO1234567"
	}
]

var conte = [
	{contenedor:"XOPO1234567"},
	{contenedor:"POPO1234567"},
	{contenedor:"LOPO1234567"},
	{contenedor:"KOPO1234567"},
	{contenedor:"MOPO1234567"},
	{contenedor:"HOPO1234567"}
]

var gates2 = [
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D011E",
		"contenedor" : "XOPO1234567"
	},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D036E",
		"contenedor" : "KOPO1234567"
	},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D036E",
		"contenedor" : "POPO1234567"
	},
	{
		"buque" : "CMA CGM HUGO",
		"viaje" : "7D036E",
		"contenedor" : "POPO1234567"
	}
]

//var result = Enumerable.from(json).toArray();

//var result2 = Enumerable.from(viajes).groupBy("$.buque" , null,
//	function (key, g) {
//		var prop = g.getSource();
//		var ter = {buque: key, data: []};
//		prop.forEach(function (item){
//			for (var pro in item){
//				if (pro !== 'buque')
//					ter.data.push(item[pro]);
//			}
//		});
//		return (ter);
//	}).toArray();
//console.log(result2);


var result2 = Enumerable.from(conte)
	.groupJoin(gates2, '$.contenedor', '$.contenedor', function (inner,outer){
		var result = {
			contenedor:'',
			gates: []
		};
		if (outer.getSource !== undefined)
			result.gates =outer.getSource();

		result.contenedor = inner;
		return result;
	}).toJSONString();

console.log( "Contenedores : " , result2);
/*
var result2 = Enumerable.from(viajes)
	.groupBy("$.buque" , null,
		function (key, g) {
			var prop = g.getSource();
			var ter = {buque: key, viajes: []};
			prop.forEach(function (item){
				for (var pro in item){
					if (pro !== 'buque')
						ter.viajes.push(item[pro]);
				}
			});
			return (ter);
		}).toJSONString();
console.log("groupBy", result2);
*/
/*
console.log('____________');

result2 = Enumerable.from(viajes)
	.groupBy('$.buque', null, 'o=>o')
	.groupJoin(gates, '$','$.buque',function (inner, outer){
		var result = {
			buque: null,
			data : []
		};
		var right;
		if (outer.getSource !== undefined)
			right = outer.getSource();
		else
			right = [];

		result.buque = inner;
		result.data = right;
		return result;
	}).toJSONString();
console.log('Join con Gates ',result2);
*/

/*
console.log('______=______');
console.log('______=_____');

var array1 = [13,413,5,135,61,631,13,61,3];
var array2 = [13,134,53,6,3,7,13,7,7,135,61,3,13];
var result = Enumerable.from(array1)
	.groupBy("",null, 'o=>o')
	.groupJoin(array2,function (uno){return uno;},function (dos){return dos;},function (uno, dos){
		var result = {
			numero: null,
			join : []
		};
		var right;
		if (dos.getSource !== undefined)
			right = dos.getSource();
		else
			right = [];

		result.numero = uno;
		result.join = right;
		return result;
	}).toArray();
console.log('____________');
console.log(result);
*/

/*
var array1 = [{a:13},{a:413}, {a:13}];
var array2 = [{a:13, c:'DERS12123'},{a:13, c:'XXX459845'}];
var result = Enumerable.from(array1)
	.groupBy("$.a",null, 'o=>o')
	.groupJoin(array2,function (uno){return uno;},function (dos){return dos.a;},function (uno, dos){
		var result = {
			numero: null,
			join : []
		};
		var right;
		if (dos.getSource !== undefined)
			right = dos.getSource();
		else
			right = [];

		result.numero = uno;
		result.join = right;
		return result;
	}).toArray();
console.log('____________');
console.log(JSON.stringify(result));
*/

