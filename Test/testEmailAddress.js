/**
 * Created by diego on 6/8/15.
 */

var config = require('../config/config.js');
var mailer = require('../include/emailjs');

var mailer = new mailer.mail(config.email);

console.log(mailer.emailSimpleValidate("operaciones@jidoka.com.ar "));