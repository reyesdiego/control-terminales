/**
 * Created by diego on 2/15/16.
 */

'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://10.1.0.60/terapi', {
    user: 'admin',
    pass: 'Pt trend 54',
    auth: {authdb: "admin"}
});



var price = require('../lib/price.js');

price = new price("TRP");
console.log(price.toString());

price.rates(true,  function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log('lib price mongo %j\n', data);
    }
});


price.ratePrices('2015-08-01',  function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log('Precio mongo %j\n', data);
    }
});



var oracle = require('../include/oracle.js');
oracle = new oracle();
//oracle.oracledb.maxRows = 5000;
oracle.oracledb.createPool({
    user: "afip",
    password: "afip_",
    connectString: "(DESCRIPTION = " +
    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
    "(CONNECT_DATA = " +
    "        (SID = AFIP) " +
    ") " +
    ")",
    poolMax: 50,
    poolMin: 2,
    poolIncrement: 5,
    poolTimeout: 4
    },
    function (err, pool) {
        'use strict';
        oracle.pool = pool;

        price = require('../lib/price.js');
        price = new price("TRP", oracle);
        console.log(price.toString());
        price.rates(true,  function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log('Oracle Price %j\n', data);
            }
        });

        price.ratePrices('2015-08-01',  function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("Oracle Precio  %j\n", data);
            }
        });


    });
