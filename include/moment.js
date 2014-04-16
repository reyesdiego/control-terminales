/**
 * Created by diego on 4/3/14.
 */

function dateTime(){
	var moment = require('moment');
	return moment().format('YY-MM-DD HH:mm');
}

module.exports.getDatetime = dateTime;