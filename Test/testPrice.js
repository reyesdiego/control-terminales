/**
 * Created by diego on 10/13/15.
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

var price = require('../include/price.js');

price = new price.price("BACTSSA");


price.rates(false,  function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }
});

price.ratePrices('2015-08-01', function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }
});