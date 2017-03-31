/**
 * Created by diego on 13/03/17.
 */
"use strict";

var senecaM = require("seneca")();
var senecaO = require("seneca")();

var config = require('../config/config.js');
senecaO.client(config.microService.statisticOracle.port, config.microService.statisticOracle.host);

//senecaM.act({role: "statistic", cmd:"tasas", terminal: "TRP"}, (err, data) => {
//    if (err) {
//        console.error(err);
//    } else {
//        console.info(data.db, data.terminal);
//    }
//});

//senecaO.act({role: "statistic", cmd:"getCodes", terminal: "TRP", fecha: "2017-03-01"}, (err, data) => {
//    if (err) {
//        console.error(err);
//    } else {
//        console.info(data);
//    }
//});

senecaO.act({role: "statistic", cmd:"getCountsByDate", terminal: "TRP", fecha: "2017-03-13"}, (err, data) => {
    if (err) {
        console.error(err);
    } else {
        console.info(data);
    }
});



