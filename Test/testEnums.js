/**
 * Created by diego on 3/3/15.
 */


var GenderEL = null;
Object.defineProperties( GenderEL, {
	MALE: {value: 1, writable: false},
	FEMALE: {value: 2, writable: false},
	UNDETERMINED: {value: 3, writable: false},
	MAX: {value: 3, writable: false},
	labels: {value:["male","female","undetermined"], writable: false}
});


console.log(GenderEL.MALE);