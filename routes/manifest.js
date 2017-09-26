/**
 * Created by diego on 11/08/17.
 */
"use strict";

module.exports = (log, oracle) => {

    var express = require('express'),
        router = express.Router();

    var Registro3SumImpoMani = require('../lib/afip/registro3_sumImpoMani.js');
    Registro3SumImpoMani = new Registro3SumImpoMani(oracle);
    var Registro4SumImpoMani = require('../lib/afip/registro4_sumImpoMani.js');
    Registro4SumImpoMani = new Registro4SumImpoMani(oracle);

    var Registro3SumExpoMane = require('../lib/afip/registro3_sumExpoMane.js');
    Registro3SumExpoMane = new Registro3SumExpoMane(oracle);
    var Registro4SumExpoMane = require('../lib/afip/registro4_sumExpoMane.js');
    Registro4SumExpoMane = new Registro4SumExpoMane(oracle);


    var Manifest = require('../lib/manifest.js');
    Manifest = new Manifest(oracle);

    let getSumariaImpo = (req, res) => {

        var params = {
            contenedor: req.query.contenedor,
            sumaria: req.query.sumaria
        };

        Manifest.getSumariaImpo(params)
        .then(data => {
                res.status(200).send(data);
            })
        .catch(err => {
                res.status(500).send(err);
            });
    };

    let getSumariaImpoContenedor = (req, res) => {

        Registro4SumImpoMani.getByContenedor(req.params.contenedor)
        .then(Reg4Data=> {
                if (Reg4Data.data.length > 0) {
                    Registro3SumImpoMani.getBySumaria(Reg4Data.data[0].sumaria)
                        .then(Reg3Data => {
                            if (Reg3Data.data.length > 0) {
                                let peso = Reg3Data.data[0].peso / Reg3Data.data[0].cantidad_total;
                                Reg4Data.data[0].peso = peso / 1000;
                                res.status(200).send(Reg4Data);
                            }
                            res.status(200).send(Reg4Data);
                        })
                        .catch(err => {
                            res.status(500).send(err);
                        });
                } else {
                    res.status(200).send(Reg4Data);
                }
            });
    };

    let getSumariaExpoContenedor = (req, res) => {

        Registro4SumExpoMane.getByContenedor(req.params.contenedor)
            .then(Reg4Data=> {
                if (Reg4Data.data.length > 0) {
                    Registro3SumExpoMane.getBySumaria(Reg4Data.data[0].sumaria)
                        .then(Reg3Data => {
                            if (Reg3Data.data.length > 0) {
                                let peso = Reg3Data.data[0].peso / Reg3Data.data[0].cantidad_total;
                                Reg4Data.data[0].peso = peso / 1000;
                            }
                            res.status(200).send(Reg4Data);
                        })
                        .catch(err => {
                            res.status(500).send(err);
                        });
                } else {
                    res.status(200).send(Reg4Data);
                }
            });
    };

    router.get('/impo', getSumariaImpo);
    router.get('/impo/container/:contenedor', getSumariaImpoContenedor);
    router.get('/expo/container/:contenedor', getSumariaExpoContenedor);

    return router;
};

