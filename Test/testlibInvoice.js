/**
 * Created by diego on 9/17/15.
 */

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log);

require('../include/mongoose.js')(log);


var inv = require('../lib/invoice.js');
inv = new inv();
inv.getInvoices({terminal: "BACTSSA", nroPtoVenta: 33}, function (result) {
    console.log(result);
});
inv.getInvoicesCSV({terminal: "BACTSSA", nroPtoVenta: 33}, function (result) {
    console.log(result);
});
