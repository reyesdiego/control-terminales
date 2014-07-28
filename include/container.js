/**
 * Created by diego on 7/25/14.
 * http://en.wikipedia.org/wiki/ISO_6346
 * for testing use : CSQU3054383
 */

// Constructor
var container = function(number) {
	this.number = number;

	var letters = {"A":10, "B":12, "C":13, "D":14, "E":15, "F":16, "G":17, "H":18, "I":19, "J":20, "K":21, "L":23, "M":24, "N":25, "O":26, "P":27, "Q":28, "R":29, "S":30, "T":31, "U":32, "V":34, "W":35, "X":36, "Y":37, "Z":38};

	var step1=0;
	for (var i = 0; i<4; i++)
		step1 += (Math.pow(2, i) * parseInt(letters[number[i]], 10));

	for (var i = 4; i<10; i++)
		step1 += (Math.pow(2, i) * parseInt(number[i], 10));

	var digit = step1 % 11;

	if (parseInt(number[10], 10) === digit)
		this.isValid = true;

}

// properties and methods
container.prototype = {
	value1: "",
	isValid: false
//	check: function() {
//		this.isValid = true;
//	}
};

// node.js module export
module.exports = container;
