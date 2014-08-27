/**
 * Created by diego on 7/30/14.
 */

var log4n = require('./include/Log/log4node.js');
var config = require('./config/config.js');


var opt = {
	file:		__filename,
	useDB:		true,
	mongo_url:	config.mongo_url_log,
	mongo_opts:	config.mongo_opts_log
}

var log = new log4n(opt);

log.info("pepe 1");
log.warn("pepe 2");
log.error("pepe 3", "user2");


var opt = {
	file: __filename,
	useDB: false
}

var log = new log4n(opt);

log.info("pepe 1");
log.warn("pepe 2");
log.error("pepe 3", "user2");



