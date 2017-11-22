/**
 * Created by Diego Reyes on 16/11/17.
 */
"use strict";

module.exports = log => {

    var express = require("express"),
        router = express.Router(),
        moment = require("moment"),
        linq = require("linq");

    var Appointment = require("../lib/appointment.js");
    Appointment = new Appointment();

    let Driver = require("../lib/driver.js");
    Driver = new Driver();

    const addDriver = async (req, res) => {
        try {
            const result = await Driver.add(req.body);
            res.status(200).send(result);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    };

    const getDriverById = async (req, res) => {
        try {
            const result = await Driver.getById(req.params.dni);
            res.status(200).send(result);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    };

    const getByContenedor = async (req, res) => {
        var param = {
            contenedor: req.params.contenedor.toUpperCase(),
            inicio: { $gte: moment(moment().format("YYYY-MM-DD")).toDate() }
        };
        try {
            const result = await Appointment.getByContainer(param);
            res.status(200).send(result);
        } catch (err) {
            console.error(err)
            res.status(500).send(err);
        };
    };

    const getContenedoresActivos = async (req, res) => {
        try {
            const result = await Appointment.getContainersActive();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const getByPatente = async (req, res) => {
        var param = {
            patenteCamion: req.params.patente.toUpperCase(),
            inicio: { $gte: moment(moment().format("YYYY-MM-DD")).toDate() }
        };
        try {
            const result = await Appointment.getByPatente(param);
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        };
    };

    const getPatentesActivos = async (req, res) => {
        try {
            const result = await Appointment.getPatentesActive();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };
        
    let getByHistoricoPatente = (req, res) => {
        var param = {
            patenteCamion: req.params.patente.toUpperCase(),
            inicio: { $gte: moment(moment().format("YYYY-MM-DD")).toDate() }
        };
        log.time("getByPatente");
        Appointment.getByPatente(param)
            .then(data => {
                log.timeEnd("getByPatente");
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getCnrtByPatente = (req, res) => {

        const dominio = req.params.patente.toUpperCase();
        var https = require("https");
        var options,
            reqGet;
        
        options = {
            host: "consultapme.cnrt.gob.ar",
            port : 443,
            path : `/api/vehiculo_cargas_habilitados/${dominio}/pais/AR`, // FVO243 TIENE
            method : "GET"
        };
        
        reqGet = https.request(options, response => {
            var resData = "";
            response.on("data", d => {
                resData += d;
            });
        
            response.on("error", err => {
                res.status(500).send({
                    status: "ERROR",
                    message: err.message,
                    data: err
                });
            });
        
            response.on("end", () => {
                let data = JSON.parse(resData);
                console.info("%j", data);
                var result = {
                    status: "OK",
                    data: []
                };
                if (data.length > 0) {
                    result.data = data[0];
                    res.status(200).send(result);
                } else if (data.code === 404) {
                    result.status = "ERROR";
                    result.message = `No se ha encontrado el CNRT para este dominio ${dominio}`;
                    res.status(404).send(result);
                }
            });
        });

        reqGet.end(); // ejecuta el request

    };

    let getCnrtByDni = (req, res) => {
        
        const dni = req.params.dni;
        var https = require("https");
        var options,
            reqGet;
        
        options = {
            host: "consultapme.cnrt.gob.ar",
            port : 443,
            path : `/api/lnh_choferes/${dni}`, // 4159980 TIENE
            method : "GET"
        };
        
        reqGet = https.request(options, response => {
            var resData = "";
            response.on("data", d => {
                resData += d;
            });
        
            response.on("error", err => {
                res.status(500).send({
                    status: "ERROR",
                    message: err.message,
                    data: err
                });
            });
        
            response.on("end", () => {
                let data = JSON.parse(resData);
                console.info("%j", data);
                var result = {
                    status: "OK",
                    data: []
                };
                if (data.length > 0) {
                    result.data = data[0];
                    res.status(200).send(result);
                } else if (data.code === 404) {
                    result.status = "ERROR";
                    result.message = `No se ha encontrado el CNRT para este dni ${dni}`;
                    res.status(404).send(result);
                }
            });
        });

        reqGet.end(); // ejecuta el request
        
    };
        
    let getCnrtByDniHabilitado = (req, res) => {
        
        const dni = req.params.dni;
        var https = require("https");
        var options,
            reqGet;
        
        options = {
            host: "consultapme.cnrt.gob.ar",
            // host: "181.209.78.18",
            port : 443,
            path : `/api/lnh_choferes_habilitados/${dni}`, // 4159980 TIENE
            method : "GET"
        };
        
        reqGet = https.request(options, response => {
            var resData = "";
            response.on("data", d => {
                resData += d;
            });
        
            response.on("error", err => {
                res.status(500).send({
                    status: "ERROR",
                    message: err.message,
                    data: err
                });
            });
        
            response.on("end", () => {
                let data = JSON.parse(resData);
                console.info("%j", data);
                var result = {
                    status: "OK",
                    data: []
                };
                if (data.length > 0) {
                    result.data = data[0];
                    res.status(200).send(result);
                } else if (data.code === 404) {
                    result.status = "ERROR";
                    result.message = `No se ha encontrado el CNRT para este dni ${dni}`;
                    res.status(404).send(result);
                }
            });
        });

        reqGet.end(); // ejecuta el request
        
    };

    router.get("/historico/patente/:patente", getByHistoricoPatente);

    router.get("/turno/patente/:patente", getByPatente);
    router.get("/turno/contenedor/:contenedor", getByContenedor);
    router.get("/turnos/contenedores", getContenedoresActivos);
    router.get("/turnos/camiones", getPatentesActivos);

    router.get("/cnrt/patente/:patente", getCnrtByPatente);
    router.get("/cnrt/chofer/:dni", getCnrtByDni);
    router.get("/cnrt/chofer/habilitado/:dni", getCnrtByDniHabilitado);
    
    router.post("/chofer", addDriver);
    router.get("/chofer/:dni", getDriverById);
    
    return router;
};