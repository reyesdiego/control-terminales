/**
 * Created by diego on 4/3/14.
 */
"use strict";

var moment = require('moment');

let dateTime = () => {
    return moment().format('YY-MM-DD HH:mm');
};

let objectIdNow = () => {
    return Math.floor(moment().getTime() / 1000).toString(16) + "0000000000000000";
};

let objectId0000 = fecha => {

    var date;
    if (fecha !== undefined) {
        date = moment(fecha);
    } else {
        date = moment();
    }

    return Math.floor(new Date(date.year(),date.month(), date.date()) / 1000).toString(16) + "0000000000000000";
};

let dateTimeFromObjectId = guid => {
	return new Date(parseInt(guid.toString().slice(0,8), 16)*1000);
};

let durationPeriod = (dateIni, dateEnd) => {

    var dif = moment(dateEnd).diff(moment(dateIni));
    return this.durationMillisecond(dif);
};

let durationMillisecond = (ms) => {

    var d = moment.duration(ms, 'milliseconds');
    var days = Math.floor(d.asDays());
    var hours = Math.floor(d.asHours());
    var mins = ("00" + (Math.floor(d.asMinutes()) - hours * 60).toString());
    mins = mins.substr(mins.length - 2, 2);
    var result;

    if (days > 0) {
        hours = hours - (days * 24);
        result = days + " días, " + hours + ":" + mins + " hs.";
    } else {
        if (hours > 0) {
            result = hours + ":" + mins + " hs.";
        } else {
            result = parseInt(mins).toString() + " min.";
        }
    }
    return result;
};

module.exports.getDatetime = dateTime;
module.exports.getObjectIdNow = objectIdNow;
module.exports.getObjectId0000 = objectId0000;
module.exports.getDateTimeFromObjectId = dateTimeFromObjectId;
module.exports.durationPeriod = durationPeriod;
module.exports.durationMillisecond = durationMillisecond;