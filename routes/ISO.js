/**
 * Created by diego on 31/08/17.
 */
"use strict";

module.exports = (log, oracle) => {
    var express = require('express'),
        router = express.Router();

    var ISO = require('../lib/ISO.js');
    ISO = new ISO(oracle);

    let getISO1 = (req, res) => {

        ISO.getISO1()
        .then (data => {
            res.status(200).send(data);
        })
        .catch (err => {
                res.status(500).send(err);
            });
    };

    let getISO2 = (req, res) => {

        ISO.getISO2()
            .then (data => {
            res.status(200).send(data);
        })
            .catch (err => {
                res.status(500).send(err);
            });
    };

    let getISO3 = (req, res) => {

        ISO.getISO3()
            .then (data => {
            res.status(200).send(data);
        })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getISO3Formas = (req, res) => {

        ISO.getISO3Formas()
            .then (data => {
            res.status(200).send(data);
        })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getISO4 = (req, res) => {

        ISO.getISO4()
            .then (data => {
            res.status(200).send(data);
        })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getISO = (req, res) => {

        var iso = req.params.ISO;

        ISO.getISO(iso)
            .then (data => {
            res.status(200).send(data);
        })
            .catch (err => {
                res.status(500).send(err);
            });
    };

    router.get('/ISO1', getISO1);
    router.get('/ISO2', getISO2);
    router.get('/ISO3', getISO3);
    router.get('/ISO3Formas', getISO3Formas);
    router.get('/ISO4', getISO4);
    router.get('/ISO/:ISO', getISO);

    return router;
};