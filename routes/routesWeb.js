/**
 * Created by diego on 3/9/15.
 */
"use strict";

module.exports = function (log, app, io, oracle, params) {
   
    var serverMain,
        state,
        match,
        mat,
        paying,
        price,
        comment,
        appointment,
        appointmentLib,
        appointmentEmailQueue,
        docType,
        unitType,
        task,
        voucherType,
        manifest,
        gate,
        invoice,
        ob2,
        ISO,
        zap,
        moment = require("moment");

    function isValidToken(req, res, next) {

        var Account = require("../models/account.js"),
            incomingToken = req.headers.token;

        Account.verifyToken(incomingToken, (err, usr) => {
            if (err) {
                log.logger.error(err);
                res.status(403).send({status: "ERROR", data: err});
            } else {
                req.usr = usr;
                next();
            }
        });
    }

    function isValidTokenZap(req, res, next) {
        
        var Account = require("../models/account.js"),
            incomingToken = req.headers.token;

        Account.verifyTokenZap(incomingToken, (err, usr) => {
            if (err) {
                log.logger.error(err);
                res.status(403).send({status: "ERROR", data: err});
            } else {
                req.usr = usr;
                next();
            }
        });
    }
        
    serverMain = require("./server")(log, params);
    app.use("/", serverMain);

    appointment = require("./appointment.js")(log);
    app.use("/appointments", isValidToken, appointment);

    appointmentEmailQueue = require("./appointmentEmailQueue")(log);
    app.use("/appointmentEmailQueues", isValidToken, appointmentEmailQueue);

    comment = require("./comment")(log, oracle);
    app.use("/comments", isValidToken, comment);

    docType = require("./docType")(log);
    app.use("/docTypes", docType);

    gate = require("./gate")(log, oracle);
    app.use("/gates", isValidToken, gate);

    invoice = require("./invoice")(log, io, oracle);
    app.use("/invoices", isValidToken, invoice);

    mat = require("./mat")(log);
    app.use("/mats", isValidToken, mat);

    match = require("./matchPrice")(log, oracle);
    app.use("/matchPrices", isValidToken, match);

    paying = require("./paying")(log, oracle);
    app.use("/paying", isValidToken, paying);

    price = require("./price")(log, oracle);
    app.use("/prices", isValidToken, price);

    state = require("./state")(log);
    app.use("/states", state);

    task = require("./task")(log);
    app.use("/tasks", isValidToken, task);

    unitType = require("./unitType")(log);
    app.use("/unitTypes", unitType);

    voucherType = require("./voucherType")(log, oracle);
    app.use("/voucherTypes", isValidToken, voucherType);

    manifest = require("./manifest")(log, oracle);
    app.use("/manifests", isValidToken, manifest);

    ISO = require("./ISO")(log, oracle);
    app.use("/ISOS", isValidToken, ISO);

    ob2 = require("./ob2")(log);
    app.use("/ob2", isValidToken, ob2);

    zap = require("./zap")(log);
    app.use("/zap", isValidTokenZap, zap);


    /**_____________________________________________________________________*/

    app.post("/sendMail", isValidToken, function (req, res) {

        var config = require("../config/config.js");
        var mail = require("../include/emailjs");

        var param = req.body;
        var html = {
            data : param.html,
            alternative: true
        };

        mail = new mail.mail(config.email);

        mail.send(param.to, param.subject, html, function (err, data) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    });

    app.get("/containerTurno/:container", (req, res) => {
        var Appointment = require("../models/appointment.js");
        var param = {};

        param.contenedor = req.params.container.toUpperCase();
        param.inicio = {$gte: moment(moment().format("YYYY-MM-DD")).toDate()};
        param["status.status"] = {$ne: 9};

        Appointment
            .find(param)
            .sort({_id: -1})
            .lean()
            .exec((err, data) => {
                if (err) {
                    res.status(500).send({status: "ERROR", data: err.message});
                } else {

                    var options,
                        reqGet;
                    var https = require("https");

                    if (data.length > 0 && data[0].transporte) {
                        if (data[0].transporte.camion !== undefined) {
                            options = {
                                host: "consultapme.cnrt.gob.ar",
                                port : 443,
                                path : `/api/vehiculo_cargas_habilitados/${data[0].transporte.camion.toUpperCase()}/pais/AR`,
                                method : "GET",
                                headers : {"Content-Type": "application/json"}
                            };

                            reqGet = https.request(options, res => {
                                var resData = "";
                                res.on("data", d => {
                                    resData += d;
                                });

                                res.on("error", (err) => {
                                    console.error("ERROR RESPONSE CNRT %s", err);
                                });

                                res.on("end", () => {
                                    var result = JSON.parse(resData);
                                    if (result && result.length > 0) {
                                        io.sockets.emit("cnrt", result[0]);
                                    } else if (result.code === 404) {
                                        io.sockets.emit("cnrt", result[0]);
                                    }
                                });
                            });
                            reqGet.end(); // ejecuta el request
                        }
                        if (data[0].hold) {
                            data[0].transporte.semi = !data[0].hold.status;
                        }
                    }

                    res.status(200).send({status: "OK", data: data || []});
                }
            });
    });

    app.get("/camionTurno/:camion", (req, res) => {
        var Appointment = require("../models/appointment.js");
        var param = {};
        var async = require("async");

        param["transporte.camion"] = req.params.camion.toUpperCase();
        param.inicio = {$gte: moment(moment().format("YYYY-MM-DD")).toDate()};

        param["status.status"] = {$ne: 9};
        Appointment
            .find(param)
            .sort({_id: -1})
            .lean()
            .exec((err, data) => {
                if (err) {
                    res.status(500).send({status: "ERROR", data: err.message});
                } else {

                    if (data.length > 0) {
                        var options,
                            reqGet;

                        var https = require("https");
                        options = {
                            host: "consultapme.cnrt.gob.ar",
                            port : 443,
                            path : `/api/vehiculo_cargas_habilitados/${req.params.camion.toUpperCase()}/pais/AR`,
                            method : "GET",
                            headers : {"Content-Type": "application/json"}
                        };

                        reqGet = https.request(options, res => {
                            var resData = "";
                            res.on("data", d => {
                                resData += d;
                            });

                            res.on("error", (err) => {
                                console.error("ERROR RESPONSE CNRT %s", err);
                            });

                            res.on("end", () => {
                                var result = JSON.parse(resData);
                                if (result && result.length > 0) {
                                    io.sockets.emit("cnrt", result[0]);
                                } else if (result.code === 404) {
                                    io.sockets.emit("cnrt", result[0]);
                                }
                            });
                        });
                        reqGet.end(); // ejecuta el request

                        if (data[0].hold) {
                            data[0].transporte.semi = !data[0].hold.status;
                        }
                    }

                    res.status(200).send({status: "OK", data: data || []});
                }
            });
    });

    app.get("/containerTurnoList", async (req, res) => {
        appointmentLib = require("../lib/appointment.js");
        appointmentLib = new appointmentLib();
        try {
            let result = await appointmentLib.getContainersActive();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({status: "ERROR", data: err.message});
        }
    });

    app.get("/camionTurnoList", async (req, res) => {
        appointmentLib = require("../lib/appointment.js");
        appointmentLib = new appointmentLib();

        try {
            let result = await appointmentLib.getPatentesActive();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({status: "ERROR", data: err.message});
        }
    });

};