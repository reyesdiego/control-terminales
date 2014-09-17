/**
 * Created by diego on 6/10/14.
 */


var person = function(name) {

	this.name = name;

}

person.prototype = {
	getName : function (){
		return 'Nombre: ' + this.name;
	}
}

exports.person = person;



