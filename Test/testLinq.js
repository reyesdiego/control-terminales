/**
 * Created by diego on 6/17/14.
 */

var Enumerable = require('linq');

var usuarios = [
	{ 	"id": 111,
		"name": "Jorge Ramirez",
		"language": "LINQ",
		"idRol": 1,
		"detail" : [{
						"idRol": 1
					},
					{
						"idRol": 2
					}
		]
	},
	{	"id": 222,
		"name": "Walter Novoa",
		"language": "C++",
		"idRol": 2,
		"detail" : [{
						"idRol": 1
					}
		]
	},
	{	"id": 333,
		"name": "Juan Carlos Ruiz",
		"language": "C#",
		"idRol": 2,
		"detail" : [{
			"idRol": 1
		}
		]
	},
	{	"id": 444,
		"name": "Roberto Alvarado",
		"language": "VB",
		"idRol": 1,
		"detail" : [{
			"idRol": 1
		}
		]
	}
]
var pepe = [{
	"idRol": 1
},
	{
		"idRol": 2
	}
];

var roles = [
	{ "id": 1, "name": "Admin" },
	{ "id": 2, "name": "Authorized" }
]


	//Array vacio para almacenar la respuesta.
	var response = [];
	var idConsulta = "4";
	switch (idConsulta) {
		//OrderBy: Selecciona todos los usuarios ordenados por Nombre.
		case "1":
			response = Enumerable.from(usuarios)
				.orderBy(function (u) { return u.name })
				.toJSONString();
			break;

		//Where: Usuarios con lenguaje diferente de C#.
		case "2":
			response = Enumerable.From(usuarios)
				.Where(function (u) { return u.language != "C#" })
				.ToJSON();
			break;

		//Join: Usuarios con su Rol.
		case "3":

			//El comodin "$" representa la variable de iteracion por defecto.
			response = Enumerable.from(usuarios)
				.join(Enumerable.from(roles), "$.idRol", "$.id", function (usuario, rol) {
					return {
						name: usuario.name,
						detail: usuario.detail,
						rol: rol.name
					}
				}).toJSONString();
			break;
		//Join: Usuarios con su Rol.
		case "4":

			//El comodin "$" representa la variable de iteracion por defecto.
			response = Enumerable.from(pepe)
				.join(Enumerable.from(roles), "$.idRol", "$.id", function (usuario, rol) {
					return {
						//name: usuario.name,
						//detail: usuario.detail,
						rol: rol.name
					}
				}).toJSONString();
			break;

		default:
			response = Enumerable.from([{ "error:": "Invalid querystring parameter." }]).toJSONString();;
	}

	console.log(response);
