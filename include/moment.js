/**
 * Created by diego on 4/3/14.
 */

function dateTime(){
	var moment = require('moment');
	return moment().format('YYYY-MM-DD HH:MM:ss');
}

module.exports.getDatetime = dateTime;