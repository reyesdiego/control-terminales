/**
 * Created by diego on 3/16/15.
 */

var Enumerable = require('linq');

var buqueTer = [ {
		"buque" : "UNO",
		"viaje" : "317"
	},
	{
		"buque" : "DOS",
		"viaje" : "318"
	},
	{
		"buque" : "TRES",
		"viaje" : "7E"
	},
	{
		"buque" : "CUATRO",
		"viaje" : "7D011E"
	},
	{
		"buque" : "CINCO",
		"viaje" : "7D035W"
	},
	{
		"buque" : "SEIS",
		"viaje" : "7D036E"
	},
	{
		"buque" : "SIETE",
		"viaje" : "7D060E"
	}];

var buqueAfip = [
	{
		"buque" : "TRES",
		"viaje" : "7E"
	},
	{
		"buque" : "CUATRO",
		"viaje" : "7E"
	},
	{
		"buque" : "SEIS",
		"viaje" : "7D036E"
	},
	{
		"buque" : "SIETE",
		"viaje" : "XXX"
	},
	{
		"buque" : "OCHO",
		"viaje" : "XXX"
	}
];
/*
var result = Enumerable.from(buqueAfip).toArray();
console.log(result)

result = Enumerable.from(buqueTer).toArray();
console.log(result)

result = Enumerable.from(buqueAfip).intersect(buqueTer, '$.buque').toArray();
console.log(result)
*/

result = Enumerable.from(buqueAfip).join(buqueTer, '$.buque', '$.buque').toArray();
console.log(result)

result = Enumerable.from(buqueTer).groupJoin(buqueAfip, '$.buque', '$.buque', function (item, g){
	var both = false;
	if (g.getSource !==undefined)
		both = true;
	return {
		buque: item.buque,
		both : both
	};
}).toArray();
console.log(result)
