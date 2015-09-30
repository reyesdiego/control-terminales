/**
 * Created by diego on 8/26/15.
 */


module.exports.validation = function (data) {

    var Validr = require('validr'),
        moment = require('moment');

//trimBody = require('trim-body');

//trimBody(req.body);
    var validate = new Validr(data);

    validate._validator.__proto__.isDate = function () {
        var msg='';

        if (this._options.ignoreEmpty && ( this._value === undefined || this._value == null || this._value === "") ) {
            return this;
        }

        if ( !(moment(this._value, "YYYY-MM-DDTHH:mm:SS.SSS", true).isValid() ||
                moment(this._value, "YYYY-MM-DD", true).isValid() ||
                moment(this._value, "YYYY/MM/DD", true).isValid() ||
                moment(this._value, "YYYY-MM-DDTHH:mm:SS.SSSZ", true).isValid() ||
                moment(this._value, "YYYY-MM-DDTHH:mm:SSZ", true).isValid())
        ) {

            if (typeof this._msg === 'string')
                msg = this._msg;
            else
                msg = this._msg['isDate'];

            this._errors.push({
                param: this._param,
                msg: msg,
                value: this._value
            });
        }

        return this;
    }

    return validate;
}
