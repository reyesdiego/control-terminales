/**
 * Created by diego on 9/28/15.
 */

    var put = undefined;

//"turnoInicio": "2015-09-28T14:00:00.000Z",
var json = {buque: "puto", viaje: "puto", mov: "IMPO", turnoInicio: null };

var Validr = require('../include/validation.js');
var validate = new Validr.validation(json);

/*validate
    .validate('buque', 'buque is required.')
    .isLength(1);

validate
    .validate('viaje', 'viaje is required.')
    .isLength(1);

validate
    .validate('mov', {
        isLength: 'mov is required.',
        isIn: 'mov must be in "IMPO" or "EXPO" or "PASO" values.'
    })
    .isLength(1)
    .isIn(['EXPO', 'IMPO', 'PASO']);

validate
    .validate('patenteCamion', {isLength: 'Patente must be a 6 characters string '}, {ignoreEmpty: true})
    .isLength(1, 6, 6);
*/
validate
    .validate('turnoInicio', {isLength: 'turnoInicio is required', isDate: 'turnoInicio must be a valid Date'}, {ignoreEmpty: true})
    .isDate();

var errors = validate.validationErrors();
if (errors) {
    console.log(errors);
} else {
    console.log("cool");
}