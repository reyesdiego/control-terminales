/**
 * Created by diego on 4/3/14.
 */

function dateTime() {
	var moment = require('moment');
	return moment().format('YY-MM-DD HH:mm');
}

function objectIdNow() {
	var moment = require('moment');

		date = moment();

	var obj = Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000";
	return obj;
}

function objectId0000(fecha) {
	var moment = require('moment');

	var date;
	if (fecha !== undefined)
		date = moment(fecha);
	else
		date = moment();

	var obj = Math.floor(new Date(date.year(),date.month(), date.date()) / 1000).toString(16) + "0000000000000000";
	return obj;
}


module.exports.getDatetime = dateTime;
module.exports.getObjectIdNow = objectIdNow;
module.exports.getObjectId0000 = objectId0000;