/**
 * Created by diego on 7/30/14.
 */

var log4n = require('../include/Log/log4node.js');

var log = new log4n();

log.logger.info(log.moment().format('YYYY-MM-DD'), {j:"LL"});
log.logger.error(log.moment().format('YYYY-MM-DD'));
log.logger.insert(log.moment().format('YYYY-MM-DD'));



