/**
 * Created by Diego Reyes on 16/11/17.
 */
// @ts-check
 "use strict";

module.exports = (log, socket, oracle) => {

    var express = require("express"),
        router = express.Router(),
        moment = require("moment"),
        async = require("async"),
        linq = require("linq");

    const Appointment = require("../lib/appointment.js");
    const appointment = new Appointment();

    const Driver = require("../lib/driver.js");
    const driver = new Driver();

    const Truck = require("../lib/truck.js");
    const truck = new Truck();

    const TruckHistory = require("../lib/truckHistory.js");
    const truckHistory = new TruckHistory();

    const Trailer = require("../lib/trailer.js");
    const trailer = new Trailer();

    const Gate = require("../lib/gate.js");
    const gate = new Gate(oracle);

    const addOrUpdateDriver = async (req, res) => {
        try {
            let result;
            if (req.method === 'POST') {
                result = await driver.add(req.body);
            } else {
                result = await driver.update(req.body);
            }
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const getDriverById = async (req, res) => {
        try {
            const result = await driver.getById(req.params.dni);
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const addOrUpdateTruck = async (req, res) => {
        try {
            let result;
            if (req.method === 'POST') {
                result = await truck.add(req.body);
            } else {
                result = await truck.update(req.body);
            }
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const addTruckHistory = async (req, res) => {
        try {
            const result = await truckHistory.add(req.body);
            res.status(200).send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    };

    const getTruckHistory = async (req, res) => {

        try {
            const result = await truckHistory.getById(req.params.patente.toUpperCase())
            res.status(200).send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }

    };

    const getTruckByPlate = async (req, res) => {
        try {
            const result = await truck.getById(req.params.patente);
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const getTrades = async (req, res) => {
        try {
            const result = await truck.getTrades();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const getColors = async (req, res) => {
        try {
            const result = await truck.getColors();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const addTrailer = async (req, res) => {
        try {
            const result = await trailer.add(req.body);
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const getTrailerByPlate = async (req, res) => {
        try {
            const result = await trailer.getById(req.params.patente);
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const getTrailerTypes = async (req, res) => {
        try {
            const result = await trailer.getTypes();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };

    const getByContenedor = async (req, res) => {
        var param = {
            contenedor: req.params.contenedor.toUpperCase(),
            inicio: { $gte: moment(moment().format("YYYY-MM-DD")).toDate() }
        };
        try {
            const result = await appointment.getByContainer(param);
            res.status(200).send(result);
        } catch (err) {
            console.error(err)
            res.status(500).send(err);
        };
    };

    const getContenedoresActivos = async (req, res) => {
        try {
            const result = await appointment.getContainersActive();
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
            const result = await appointment.getByPatente(param);
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        };
    };

    const getPatentesActivos = async (req, res) => {
        try {
            const result = await appointment.getPatentesActive();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(err);
        }
    };
        
    const getCnrtByPatente = (req, res) => {

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

    const getCnrtByDni = (req, res) => {
        
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
        
    const getCnrtByDniHabilitado = (req, res) => {
        
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

    const requestTrucks = (req, res) => {
        const param = req.body;
        const user = req.usr;
        let camiones = req.body.camiones;
        let tasks = [];
        
        if (camiones.length > 0) {
            tasks = camiones.map(camion => (callback => {

                gate.getGatesInOrOut({terminal: "ZAP", patenteCamion: camion}, {skip:0, limit: 1000})
                .then(data => {
                    if (data.data.length === 1) {
                        socket.emit('requestTruck', {camion: camion, terminal: user.terminal});
                        gate.setPedido(data.data[0]._id, data.data[0].status + 10);
                    }
                    callback();
                })
                .catch(err => {
                    callback(err);
                });
            }));
            async.parallel(tasks, (err, data) => {
                res.status(200).send({
                    status: "OK",
                    message: `Se han solitidado ${param.cantidad} camiones.`,
                    data: camiones
                })
                })
        } else {
            socket.emit('requestTruck', {cantidad: param.cantidad, terminal: user.terminal});
            res.status(200).send({
                status: "OK",
                message: `Se han solitidado ${param.cantidad} camiones.`,
                data: camiones
            })
        }


    }

    router.post("/historico", addTruckHistory);
    router.get("/historico/camion/:patente", getTruckHistory);

    router.get("/turno/patente/:patente", getByPatente);
    router.get("/turno/contenedor/:contenedor", getByContenedor);
    router.get("/turnos/contenedores", getContenedoresActivos);
    router.get("/turnos/camiones", getPatentesActivos);

    router.get("/cnrt/patente/:patente", getCnrtByPatente);
    router.get("/cnrt/patente/playo/:patente", getCnrtByPatente);
    router.get("/cnrt/chofer/:dni", getCnrtByDni);
    router.get("/cnrt/chofer/habilitado/:dni", getCnrtByDniHabilitado);
    
    router.post("/chofer", addOrUpdateDriver);
    router.put("/chofer", addOrUpdateDriver);
    router.get("/chofer/:dni", getDriverById);
    
    router.post("/camion", addOrUpdateTruck);
    router.put("/camion", addOrUpdateTruck);
    router.get("/camionesmarcas", getTrades);
    router.get("/colors", getColors);
    router.get("/camion/:patente", getTruckByPlate);

    router.post("/playo", addTrailer);
    router.get("/playotypes", getTrailerTypes);
    router.get("/playo/:patente", getTrailerByPlate);

    router.post("/pedircamiones", requestTrucks);
    return router;
};