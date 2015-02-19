/**
 * Created by diego on 2/19/15.
 */

var Enumerable = require('linq');

var usuarios = [
	{ 	"codTipoComprob": 1,
		terminal:"TRP",
		"cnt": 1
	},
	{ 	"codTipoComprob": 3,
		terminal:"TRP",
		"cnt": 1
	},
	{ 	"codTipoComprob": 2,
		terminal:"TRP",
		"cnt": 1
	},
	{ 	"codTipoComprob": 1,
		terminal:"BACTSSA",
		"cnt": 3
	},
	{ 	"codTipoComprob": 2,
		terminal:"BACTSSA",
		"cnt": 3
	}
]

//Array vacio para almacenar la respuesta.
var response = [];
var idConsulta = "2";
switch (idConsulta) {
	//OrderBy: Selecciona todos los usuarios ordenados por Nombre.
	case "1":
		response = Enumerable.from(usuarios)
			.orderBy(function (u) { return u.cnt })
			.toJSONString();
		break;

	case "2":
		response = Enumerable.from(usuarios)
			.groupBy(
				function (item){
					return item.codTipoComprob
				},
				function (item){
					return item
				},
				function (job, grouping) {

					var grupoItem={codTipoComprob: job};

					var grupo = grouping.getSource();
					grupo.forEach(function (item){
						grupoItem[item.terminal] = item.cnt;
					});

					return grupoItem;

			}).toArray();
		break;

	default:
		response = Enumerable.from([{ "error:": "Invalid querystring parameter." }]).toJSONString();;
}

console.log(response);
