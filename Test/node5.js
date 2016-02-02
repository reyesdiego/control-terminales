/**
 * Created by diego on 1/8/16.
 */
'use strict'

var linq = require('linq');
var util = require('util');
var Invoice = require('../models/invoice.js');
var fecha;

var config = require('../config/config.js'),
    log4n = require('../include/log/log4node.js'),
    log = new log4n.log(config.log);

require('../include/mongoose.js')(log);

class Invoices {
    constructor() {
    }

    static correlative(callback) {

        console.time("uno")
        var pepe = log.time("uno");
        for (var i=0;i<10000000; i++) {
            var k = 3 * i;
        }
        console.timeEnd("uno")
        log.timeEnd("uno");
        for (var i=0;i<1000000000; i++) {
            var k = 3 * i;
        }
        console.timeEnd("uno")
        log.timeEnd("uno");
        callback();



        var async,
            cashboxExecs = [],
            cashBoxes,
            faltantes = [],
            control = 0,
            contadorFaltantes = 0,
            dif,
            item2Add,
            i,
            len,
            contadorFaltantesTotal = 0;

        cashBoxes = [1, 5];
        cashBoxes.forEach(function (cash) {
            //funcion que calcula la correlatividad por cada caja que sera ejecutada en paralelo con async
            var cashboxExec = function (callback) {

                var invoice = Invoice.find({
                    terminal: "TERMINAL4",
                    nroPtoVenta: cash,
                    codTipoComprob: 1
                }, {'fecha.emision': 1, nroComprob: 1, _id: -1});
                invoice.lean();
                invoice.sort({nroComprob: 1});

                //invoice.limit(200000);

                console.time("consulta Base");

                invoice.exec(function (err, invoicesData) {
                    console.timeEnd("consulta Base");

                    /*
                     console.time("arr");
                     var arr = linq.range(0, invoicesData.length).toArray();
                     console.timeEnd("arr");
                     */
                    console.time("uno");
                    invoicesData.forEach(function (invoice) {

                        if (control === 0) {
                            control = invoice.nroComprob;
                        } else {
                            control += 1;
                            if (control !== invoice.nroComprob) {
                                if (invoice.nroComprob - control > 3) {
                                    dif = (invoice.nroComprob) - control;
                                    contadorFaltantes += dif;
                                    item2Add = util.format('[%d a %d] (%d)', control, (invoice.nroComprob - 1), dif);
                                    fecha = util.format('[%d a %d] (%d)', control, (invoice.nroComprob - 1), dif);
                                    faltantes.push({n: item2Add, d: invoice.fecha.emision});
                                } else {
                                    len = invoice.nroComprob;
                                    for (i = control; i < len; i++) {
                                        faltantes.push({n: i.toString(), d: invoice.fecha.emision});
                                        contadorFaltantes++;
                                    }
                                }
                                control = invoice.nroComprob;
                            }
                        }
                    });
                    var result = {
                        status: 'OK',
                        nroPtoVenta: cash,
                        totalCount: contadorFaltantes,
                        data: faltantes
                    };
                    return callback(null, result);
                    console.log(contadorFaltantes)
                    console.timeEnd("uno");

                });
            }

            cashboxExecs.push(cashboxExec);

        });

        async = require('async');
        async.parallel(cashboxExecs, function (err, results) {
            console.log("termino");
            var response = {
                status: "OK",
                totalCount: contadorFaltantesTotal,
                data: results
            };

            callback(err, response);

        });

    }

}
module.exports = Invoices;
