/**
 * Created by Administrator on 1/17/14.
 */
var config;

if (process.env.NODE_ENV === 'development') {
    config = require('./config_dev.json');
} else {
    config = require('./config_pro.json');
}

module.exports = config;
