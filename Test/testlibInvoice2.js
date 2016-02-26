/**
 * Created by diego on 2/12/16.
 */
var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log);

//Conecta a la base de datos MongoDb
require('../include/mongoose.js')(log);

var Invoice = require('../lib/invoice2.js');
Invoice = new Invoice();
console.log(Invoice.toString());

Invoice.getInvoices({terminal: "TRP", skip: 0, limit: 2}, function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }
    process.exit();
});
