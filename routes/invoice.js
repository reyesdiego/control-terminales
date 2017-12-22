/**
 * Created by Diego Reyes on 1/7/14.
 *
 * @module Routes
 */
module.exports = function(log, io, oracle) {
    "use strict";

    var express = require("express"),
        router = express.Router(),
        util = require("util"),
        moment = require("moment"),
        config = require("../config/config.js"),
        Invoice = require("../models/invoice.js");

    var Invoice2 = require("../lib/invoice2.js");
    Invoice2 = new Invoice2(oracle);

    //GET - Return all invoice in the DB
    let getInvoices = (req, res) => {
        var usr = req.usr,
            paramTerminal = req.params.terminal,
            limit = parseInt(req.params.limit, 10),
            skip = parseInt(req.params.skip, 10),
            ter = usr.role === "agp" ? paramTerminal : usr.terminal,
            param = {};

        param.fechaInicio = req.query.fechaInicio;
        param.fechaFin = req.query.fechaFin;
        param.nroPtoVenta = req.query.nroPtoVenta;
        param.codTipoComprob = req.query.codTipoComprob;
        param.nroComprobante = req.query.nroComprobante;
        param.razonSocial = req.query.razonSocial;
        param.documentoCliente = req.query.documentoCliente;
        param.contenedor = req.query.contenedor;
        param.buqueNombre = req.query.buqueNombre;
        param.viaje = req.query.viaje;
        param.code = req.query.code;
        param.payment = req.query.payment;
        param.rates = req.query.rates;
        param.estado = req.query.estado;
        param.order = req.query.order;
        param.group = usr.group;
        param.resend = req.query.resend;
        param.terminal = ter;
        param.iso3Forma = req.query.iso3Forma;

        if (skip >= 0 && limit >= 0) {
            param.skip = skip;
            param.limit = limit;
            log.time("getInvoices");
            Invoice2.getInvoices(param, (err, result) => {
                if (err) {
                    res
                        .status(500)
                        .send({ status: "ERROR", data: err.message });
                } else {
                    result.time = log.timeEnd("getInvoices");
                    res.status(200).send(result);
                }
            });
        } else {
            Invoice2.getInvoicesCSV(param)
                .then(data => {
                    res.header("content-type", "text/csv");
                    res.header(
                        "content-disposition",
                        "attachment; filename=report.csv"
                    );
                    res.status(200).send(data.data);
                })
                .catch(err => {
                    res.status(500).send(err);
                });
        }
    };

    function getInvoice(req, res) {
        var usr = req.usr,
            param = {
                _id: req.params.id
            };

        if (usr.role !== "agp") {
            param.terminal = usr.terminal;
        }

        Invoice2.getInvoice(param)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("%s", err);
                res.status(500).send(err);
            });
    }

    function getClients(req, res) {
        var param = {
            terminal: req.params.terminal
        };

        Invoice2.getClients(param)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("%s", err);
                res.status(500).send(err);
            });
    }

    function getContainers(req, res) {
        var param = {
            terminal: req.params.terminal
        };

        Invoice2.getContainers(param)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("%s", err);
                res.status(500).send(err);
            });
    }

    function getCounts(req, res) {
        var param = {};

        param.fecha = req.query.fecha;

        Invoice2.getCounts(param, function(err, data) {
            if (err) {
                log.logger.error(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }

    let getCountByDate = (req, res) => {
        var seneca = require("seneca")();
        seneca.client(
            config.microService.statisticOracle.port,
            config.microService.statisticOracle.host
        );

        var param = {
            role: "statistic",
            cmd: "getCountsByDate",
            entity: "invoice"
        };

        if (req.query.fecha !== undefined) {
            param.fecha = req.query.fecha;
        }
        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    };

    let getCountByMonth = (req, res) => {
        var seneca = require("seneca")();
        seneca.client(
            config.microService.statisticOracle.port,
            config.microService.statisticOracle.host
        );

        var param = {
            role: "statistic",
            cmd: "getCountByMonth",
            entity: "invoice"
        };

        if (req.query.fecha !== undefined) {
            param.fecha = req.query.fecha;
        }

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    };

    var getLastInsert = (req, res) => {
        var terminal = req.params.terminal;
        var lastHours = req.query.lastHours;

        var Invoice3 = require("../lib/invoice2.js");
        Invoice3 = new Invoice3();

        Invoice3.getLastInsert(terminal, lastHours)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    function getNoRates(req, res) {
        var terminal = req.params.terminal,
            Invoice = require("../lib/invoice2.js"),
            invoice,
            fecha,
            param = {};

        param.skip = parseInt(req.params.skip, 10);
        param.limit = parseInt(req.params.limit, 10);
        param.terminal = terminal;

        if (req.query.fechaInicio || req.query.fechaFin) {
            if (req.query.fechaInicio) {
                fecha = moment(
                    moment(req.query.fechaInicio, "YYYY-MM-DD")
                ).toDate();
                param.fechaInicio = fecha;
            }
            if (req.query.fechaFin) {
                fecha = moment(
                    moment(req.query.fechaFin, "YYYY-MM-DD")
                ).toDate();
                param.fechaFin = fecha;
            }
        }
        if (req.query.contenedor) {
            param.contenedor = req.query.contenedor;
        }

        if (req.query.razonSocial) {
            param.razon = req.query.razonSocial;
        }
        invoice = new Invoice();

        invoice.getNoRates(param, function(err, invoices) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(invoices);
            }
        });
    }

    function getRatesTotal(req, res) {
        var today = moment(moment().format("YYYY-MM-DD")).toDate(),
            tomorrow = moment(moment().format("YYYY-MM-DD"))
                .add(1, "days")
                .toDate(),
            _price,
            _rates,
            sum = {},
            jsonParam;

        if (req.query.fecha !== undefined) {
            today = moment(req.query.fecha, "YYYY-MM-DD").toDate();
            tomorrow = moment(req.query.fecha, "YYYY-MM-DD")
                .add(1, "days")
                .toDate();
        }

        _price = require("../include/price.js");
        _rates = new _price.price();
        _rates.rates(function(err, rates) {
            if (req.params.currency === "PES") {
                sum = {
                    $cond: [
                        { $eq: ["$codMoneda", "PES"] },
                        "$detalle.items.impTot",
                        { $multiply: ["$detalle.items.impTot", "$cotiMoneda"] }
                    ]
                };
            } else if (req.params.currency === "DOL") {
                sum = {
                    $cond: [
                        { $eq: ["$codMoneda", "DOL"] },
                        "$detalle.items.impTot",
                        { $divide: ["$detalle.items.impTot", "$cotiMoneda"] }
                    ]
                };
            }

            jsonParam = [
                { $match: { "fecha.emision": { $gte: today, $lt: tomorrow } } },
                { $unwind: "$detalle" },
                { $unwind: "$detalle.items" },
                { $match: { "detalle.items.id": { $in: rates } } },
                { $project: { terminal: 1, "detalle.items": 1, total: sum } },
                {
                    $group: {
                        _id: { terminal: "$terminal" },
                        cnt: { $sum: 1 },
                        total: { $sum: "$total" }
                    }
                }
            ];
            Invoice.aggregate(jsonParam, function(err, data) {
                if (err) {
                    res
                        .status(500)
                        .send({ status: "ERROR", data: err.message });
                } else {
                    res.status(200).send({
                        status: "OK",
                        data: data
                    });
                }
            });
        });
    }

    function getRatesLiquidacion(req, res) {
        var param;

        if (
            req.query.fechaInicio === undefined ||
            req.query.fechaFin === undefined
        ) {
            res.status(401).send({
                status: "ERROR",
                message: "Debe proveer parametros de fecha"
            });
        } else {
            param = {
                fechaInicio: req.query.fechaInicio,
                fechaFin: req.query.fechaFin,
                period: req.query.period,
                tasaAgp: req.query.tasaAgp,
                nroPtoVenta: req.query.nroPtoVenta,
                codTipoComprob: req.query.codTipoComprob,
                nroComprobante: req.query.nroComprobante,
                razonSocial: req.query.razonSocial,
                documentoCliente: req.query.documentoCliente,
                resend: req.query.resend,
                estado: req.query.estado,
                contenedor: req.query.contenedor,
                buqueNombre: req.query.buqueNombre,
                viaje: req.query.viaje,
                code: req.query.code,
                iso3Forma: req.query.iso3Forma
            };

            log.time("getRatesByTerminal");
            Invoice2.getRatesByTerminal(param)
                .then(data => {
                    log.timeEnd("getRatesByTerminal");
                    res.status(200).send(data);
                })
                .catch(err => {
                    res.status(500).send(err);
                });
        }
    }

    let getRatesPeriod = (req, res) => {
        var param;

        if (
            req.query.fechaInicio === undefined ||
            req.query.fechaFin === undefined
        ) {
            res.status(401).send({
                status: "ERROR",
                message: "Debe proveer parametros de fecha"
            });
        } else {
            let path = req.route.path;
            param = {
                fechaInicio: req.query.fechaInicio,
                fechaFin: req.query.fechaFin,
                period: path
                    .substr(path.lastIndexOf("/") + 1, path.length)
                    .toLowerCase(),
                tasaAgp: req.query.tasaAgp
            };

            log.time(`getRatesPeriod${param.period}`);
            Invoice2.getRatesByPeriod(param)
                .then(data => {
                    log.timeEnd(`getRatesPeriod${param.period}`);
                    res.status(200).send(data);
                })
                .catch(err => {
                    res.status(500).send(err);
                });
        }
    };

    function getRatesByContainer(req, res) {
        var params = {};
        var usr = req.usr;
        var paramTerminal = req.params.terminal;

        params.terminal = usr.role === "agp" ? paramTerminal : usr.terminal;

        //params.currency = req.params.currency;
        params.contenedor = req.params.container;
        //params.buqueNombre = req.query.buque;
        //params.viaje = req.query.viaje;

        log.time("getRatesByContainer");
        Invoice2.getRatesByContainer(params)
            .then(data => {
                log.timeEnd("getRatesByContainer");
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    }

    function getNoMatches(req, res) {
        var param = {
            terminal: req.params.terminal,
            skip: parseInt(req.params.skip, 10),
            limit: parseInt(req.params.limit, 10),
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin,
            order: req.query.order,
            razonSocial: req.query.razonSocial,
            code: req.query.code
        };

        log.time("invoice - getNoMatches");
        Invoice2.getNoMatches(param)
            .then(data => {
                log.timeEnd("invoice - getNoMatches");
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(200).send(err);
            });
    }

    function getCorrelative(req, res) {
        var usr = req.usr,
            fecha;

        if (req.query.codTipoComprob === undefined) {
            log.logger.error("El Tipo de Comprobante no ha sido enviado");
            res.status(403).send({
                status: "ERROR",
                data: "El Tipo de Comprobante no ha sido enviado"
            });
        }

        var param = {};

        if (usr.role === "agp") {
            param.terminal = req.params.terminal;
        } else {
            param.terminal = usr.terminal;
        }

        if (req.query.fechaInicio || req.query.fechaFin) {
            if (req.query.fechaInicio) {
                fecha = moment(req.query.fechaInicio, "YYYY-MM-DD").toDate();
                param.fechaInicio = fecha;
            } else {
                param.fechaInicio = moment("2000-01-01", "YYYY-MM-DD").toDate();
            }
            if (req.query.fechaFin) {
                fecha = moment(req.query.fechaFin, "YYYY-MM-DD").toDate();
                param.fechaFin = fecha;
            }
        }
        if (req.query.codTipoComprob) {
            param.codTipoComprob = parseInt(req.query.codTipoComprob, 10);
        }

        log.time(`getCorrelative Pto Venta ${req.query.codTipoComprob}`);
        Invoice2.getCorrelative(param)
            .then(data => {
                let result = {
                    status: "OK",
                    totalCount: data.totalCount,
                    data: data.data,
                    time: log.timeEnd(
                        `getCorrelative Pto Venta ${req.query.codTipoComprob}`
                    )
                };
                io.sockets.emit("correlative_" + req.query.x, result);
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("%s", err.message);
                res.status(500).send(err);
            });
    }

    function getCashbox(req, res) {
        var param = {};

        param.terminal =
            req.usr.role === "agp" ? req.params.terminal : req.usr.terminal;
        param.fechaInicio = req.query.fechaInicio;
        param.fechaFin = req.query.fechaFin;
        param.nroPtoVenta = req.query.nroPtoVenta;
        param.codTipoComprob = req.query.codTipoComprob;
        param.nroComprobante = req.query.nroComprobante;
        param.razonSocial = req.query.razonSocial;
        param.documentoCliente = req.query.documentoCliente;
        param.contenedor = req.query.contenedor;
        param.buqueNombre = req.query.buqueNombre;
        param.viaje = req.query.viaje;
        param.code = req.query.code;
        param.resend = req.query.resend;
        param.estado = req.query.estado;

        Invoice2.getCashbox(param)
            .then(data => {
                res.status(200).send({ status: "OK", data: data.sort() });
            })
            .catch(err => {
                res.status(500).send({ status: "ERROR", data: err.message });
            });
    }

    function updateInvoice(req, res) {
        var usr = req.usr,
            errMsg;

        var param = { _id: req.params._id, terminal: req.params.terminal };
        Invoice.findOneAndUpdate(param, { $set: req.body }, null, function(
            err,
            data
        ) {
            if (err) {
                errMsg = util.format("%s", err.error);
                log.logger.error(errMsg);
                res.status(500).send({ status: "ERROR", message: errMsg });
            } else {
                res.status(200).send({ status: "OK", data: data });
            }
        });
    }

    function addState(req, res) {
        var usr = req.usr;

        var param = {
            user: usr.user,
            group: usr.group,
            invoiceId: req.params._id,
            estado: req.body.estado
        };
        Invoice2.addState(param)
            .then(data => {
                res.status(200).send({ status: "OK", data: data });
            })
            .catch(err => {
                log.logger.error("INVOICE SET STATE %s", err.message);
                res.status(500).send(err);
            });
    }

    function removeInvoices(req, res) {
        Invoice.remove({ _id: req.params._id }, function(err) {
            if (!err) {
                log.logger.info("Invoice Removed %s", req.params._id);
                res.status(200).send({ status: "OK", data: "OK" });
            } else {
                res.status(500).send({
                    status: "ERROR",
                    data: "Error al intentar eliminar"
                });
            }
        });
    }

    /** Seneca */
    let getInvoicesByRates = (req, res) => {
        var seneca = require("seneca")({
            timeout: config.microService.statisticOracle.timeout
        });
        seneca.client(
            config.microService.statisticOracle.port,
            config.microService.statisticOracle.host
        );

        var param = {
            role: "statistic",
            entity: "invoice",
            cmd: "getByRates"
        };

        console.log(req.body);

        param.rates = req.body.data;
        param.fechaInicio = req.query.fechaInicio;
        param.fechaFin = req.query.fechaFin;

        console.log("query%s", JSON.stringify(req.query));

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send({
                    status: "ERROR",
                    message: err.msg,
                    data: err
                });
            } else {
                res.status(200).send(data);
            }
        });
    };

    /** Seneca */
    let getInvoicesByRatesPivot = (req, res) => {
        var seneca = require("seneca")({
            timeout: config.microService.statisticOracle.timeout
        });
        seneca.client({
            port: config.microService.statisticOracle.port,
            host: config.microService.statisticOracle.host
        });

        var param = {
            role: "statistic",
            entity: "invoice",
            cmd: "getByRatesPivot"
        };
        param.rates = req.body;
        param.fechaInicio = req.query.fechaInicio;
        param.fechaFin = req.query.fechaFin;

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send({
                    status: "ERROR",
                    message: err.msg,
                    data: err
                });
            } else {
                res.status(200).send(data);
            }
        });
    };

    /** Seneca */
    let getInvoicesByGroupsPivot = (req, res) => {
        var seneca = require("seneca")();
        seneca.client({
            port: config.microService.statisticOracle.port,
            host: config.microService.statisticOracle.host,
            timeout: 60000
        });

        var param = {
            role: "statistic",
            entity: "invoice",
            cmd: "getByGroupsPivot"
        };
        param.groups = req.body;
        param.fechaInicio = req.query.fechaInicio;
        param.fechaFin = req.query.fechaFin;

        seneca.act(param, (err, data) => {
            if (err) {
                res.status(500).send({
                    status: "ERROR",
                    message: err.msg,
                    data: err
                });
            } else {
                res.status(200).send(data);
            }
        });
    };

    let getInvoicesByRatesTerminal = (req, res) => {
        var params = {};
        var options = {};

        params.terminal = req.params.terminal;

        if (req.query.fechaInicio && req.query.fechaFin) {
            params.fechaInicio = moment(req.query.fechaInicio).format(
                "YYYY-MM-DD"
            );
            params.fechaFin = moment(req.query.fechaFin).format("YYYY-MM-DD");
        } else {
            if (req.query.year) {
                params.year = parseInt(req.query.year);
            }
            if (req.query.month) {
                params.month = parseInt(req.query.month);
            }
        }

        if (req.query.output === "csv") {
            options.output = "csv";
        }
        if (req.query.tarifa === "agp") {
            options.tarifa = "agp";
        }

        log.time("getInvoicesByRatesTerminal");
        Invoice2.getInvoicesByRatesTerminal(params, options)
            .then(data => {
                log.timeEnd("getInvoicesByRatesTerminal");
                if (options.output === "csv") {
                    res.header("content-type", "text/csv");
                    res.header(
                        "content-disposition",
                        "attachment; filename=report.csv"
                    );
                    res.status(200).send(data.data);
                } else {
                    res.status(200).send(data);
                }
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    function getShips(req, res) {
        var param = {
            terminal: req.params.terminal
        };

        Invoice2.getShips(param)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("%s", err);
                res.status(500).send(err);
            });
    }

    let getShipTrips = (req, res) => {
        var usr = req.usr;
        var paramTerminal = req.params.terminal;

        var ter = usr.role === "agp" ? paramTerminal : usr.terminal;
        var param = {
            terminal: ter,
            "detalle.buque.nombre": { $ne: null }
        };

        Invoice2.getShipTrips(param)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getShipContainers = (req, res) => {
        var usr = req.usr,
            ter,
            param;

        log.time("getShipContainers");

        ter = usr.role === "agp" ? req.params.terminal : usr.terminal;
        param = {
            terminal: ter,
            buque: req.query.buqueNombre,
            viaje: req.query.viaje
        };

        Invoice2.getShipContainers(param)
            .then(data => {
                if (data !== undefined) {
                    data.time = log.timeEnd("getShipContainers");
                }
                res.status(200).send(data);
            })
            .catch(err => {
                log.logger.error("%s", err);
                res.status(500).send(err);
            });
    };

    function getContainersNoRates(req, res) {
        var usr = req.usr;
        var ter = usr.role === "agp" ? req.params.terminal : usr.terminal;
        var params = {
            terminal: ter,
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin,
            razonSocial: req.query.razonSocial,
            buqueNombre: req.query.buqueNombre,
            viaje: req.query.viaje
        };

        log.time("getContainersNoRates");
        Invoice2.getContainersNoRates(params, (err, data) => {
            if (err) {
                res.status(500).json(err);
            } else {
                log.timeEnd("getContainersNoRates");
                res.status(200).json(data);
            }
        });
    }

    let getTotales = (req, res) => {
        var usr = req.usr,
            paramTerminal = req.params.terminal,
            ter = usr.role === "agp" ? paramTerminal : usr.terminal,
            param = {};

        param.fechaInicio = req.query.fechaInicio;
        param.fechaFin = req.query.fechaFin;
        param.nroPtoVenta = req.query.nroPtoVenta;
        param.codTipoComprob = req.query.codTipoComprob;
        param.nroComprobante = req.query.nroComprobante;
        param.razonSocial = req.query.razonSocial;
        param.documentoCliente = req.query.documentoCliente;
        param.contenedor = req.query.contenedor;
        param.buqueNombre = req.query.buqueNombre;
        param.viaje = req.query.viaje;
        param.code = req.query.code;
        param.payment = req.query.payment;
        param.rates = req.query.rates;
        param.estado = req.query.estado;
        param.order = req.query.order;
        param.group = usr.group;
        param.resend = req.query.resend;
        param.terminal = ter;
        param.iso3Forma = req.query.iso3Forma;

        log.time("getTotales");
        Invoice2.getTotales(param)
            .then(data => {
                log.timeEnd("getTotales");
                res.status(200).send(data);
            })
            .catch(err => {
                log.timeEnd("getTotales");
                res.status(500).send(err);
            });
    };

    let getTotals = (req, res) => {
        var paramTerminal = req.query.terminal,
            fechaInicio = moment(moment("2014-08-01").format("YYYY-MM-DD")),
            fechaFin = moment(moment().format("YYYY-MM-DD")),
            params = {},
            options = {};

        params.terminal = paramTerminal;

        if (req.query.fechaInicio) {
            params.fechaInicio = req.query.fechaInicio;
        } else {
            params.fechaInicio = fechaInicio;
        }
        if (req.query.fechaFin) {
            params.fechaFin = req.query.fechaFin;
        } else {
            params.fechaFin = fechaFin;
        }

        if (req.query.clients) {
            if (typeof req.query.clients === "string") {
                params.clients = [req.query.clients];
            } else {
                params.clients = req.query.clients;
            }
        }
        if (req.query.top) {
            params.top = req.query.top;
        }
        if (req.query.order) {
            params.order = req.query.order;
        }
        if (req.query.campo) {
            params.campo = req.query.campo;
        }
        if (req.query.output === "csv") {
            options.output = "csv";
        }
        log.time("getTotalByClient");
        Invoice2.getTotalByClient(params, options)
            .then(data => {
                log.timeEnd("getTotalByClient");
                if (options.output === "csv") {
                    res.header("content-type", "text/csv");
                    res.header(
                        "content-disposition",
                        "attachment; filename=report.csv"
                    );
                    res.status(200).send(data.data);
                } else {
                    res.status(200).send(data);
                }
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    var setResend = (req, res) => {
        var resend = parseInt(req.query.resend);
        var id = parseInt(req.params.id);

        if (resend !== 0 && resend !== 1) {
            res.status(400).send({
                status: "ERROR",
                message: "El parámetro resend debe ser 0 o 1"
            });
        } else {
            Invoice2.setResend(id, resend)
                .then(data => {
                    log.logger.info(
                        "UPDATE ORA RESEND: %s - %s",
                        resend,
                        req.params.id
                    );
                    res.status(200).send(data);
                })
                .catch(err => {
                    log.logger.error(
                        "UPDATE ORA RESEND: %s - %s - %s",
                        resend,
                        req.params.id,
                        err.message
                    );
                    res.status(500).send(err);
                });

            /*
             var InvoiceMongoDB = require('../lib/invoice2.js');
             InvoiceMongoDB = new InvoiceMongoDB();
             InvoiceMongoDB.setResend(req.params.id, resend)
             .then(data => {
             log.logger.info('UPDATE MONGO RESEND: %s - %s', resend, req.params.id);
             })
             .catch(err => {
             log.logger.error('UPDATE MONGO RESEND: %s - %s - %s', resend, req.params.id, err.message);
             });
             */
        }
    };

    let getByCode = (req, res) => {
        var code = req.query.code;
        var terminal = req.query.terminal;

        Invoice2.getByCode(code, terminal)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getByContainer = (req, res) => {
        var params = {
            container: req.query.contenedor,
            terminal: req.query.terminal,
            buque: req.query.buqueNombre,
            viaje: req.query.viaje
        };

        Invoice2.getByContainer(params)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    let getTotalByContainer = (req, res) => {
        var options = {};

        var params = {
            top: req.query.top,
            order: req.query.order
        };

        if (req.query.fechaInicio) {
            params.fechaInicio = req.query.fechaInicio;
        }
        if (req.query.fechaFin) {
            params.fechaFin = req.query.fechaFin;
        }

        if (req.query.output === "csv") {
            options.output = "csv";
        }
        log.time("getTotalByContainer");
        Invoice2.getTotalByContainer(params, options)
            .then(data => {
                log.timeEnd("getTotalByContainer");
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    };

    const getHeaderDetail = async (req, res) => {
        let param = {};
        try {
            if (req.query.fechaInicio) {
                param.fechaInicio = req.query.fechaInicio;
            }
            if (req.query.fechaFin) {
                param.fechaFin = req.query.fechaFin;
            }

            let result = await Invoice2.getHeaderDetail(param, {
                skip: req.query.skip,
                limit: req.query.limit
            });
            res.status(200).send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    };
    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.param("terminal", function(req, res, next, terminal) {
        var usr = req.usr,
            errMsg;

        if (usr.terminal !== "AGP" && usr.terminal !== terminal) {
            errMsg = util.format(
                "%s",
                "La terminal recibida por parámetro es inválida para el token."
            );
            log.logger.error(errMsg);
            res.status(500).send({ status: "ERROR", data: errMsg });
        } else {
            next();
        }
    });

    router.get("/:terminal/down", getInvoices);
    router.get("/:terminal/:skip/:limit", getInvoices);
    router.get("/invoice/:id", getInvoice);
    router.get("/counts", getCounts);
    router.get("/countsByDate", getCountByDate);
    router.get("/countsByMonth", getCountByMonth);
    router.get("/noRates/:terminal/:skip/:limit", getNoRates);
    router.get("/ratesTotal/:currency", getRatesTotal);
    router.get("/rates", getRatesLiquidacion);
    router.get("/rates/date", getRatesPeriod);
    router.get("/rates/month", getRatesPeriod);
    router.get("/rates/year", getRatesPeriod);
    router.get("/rates/:terminal/:container/:currency", getRatesByContainer);
    router.post("/byRates", getInvoicesByRates);
    router.post("/byRates/pivot", getInvoicesByRatesPivot);
    router.post("/byGroups/pivot", getInvoicesByGroupsPivot);
    router.get("/noMatches/:terminal/:skip/:limit", getNoMatches);
    router.get("/correlative/:terminal", getCorrelative);
    router.get("/cashbox/:terminal", getCashbox);
    router.put("/invoice/:terminal/:_id", updateInvoice);
    router.delete("/:_id", removeInvoices);
    router.get("/:terminal/ships", getShips);
    router.get("/:terminal/containers", getContainers);
    router.get("/:terminal/clients", getClients);
    router.get("/:terminal/shipTrips", getShipTrips);
    router.get("/:terminal/shipContainers", getShipContainers);
    router.get("/:terminal/byRates", getInvoicesByRatesTerminal);
    router.get("/containersNoRates/:terminal", getContainersNoRates);
    router.get("/totales", getTotales);
    router.get("/totalClient", getTotals);
    router.get("/totalClientTop", getTotals);
    router.put("/setState/:terminal/:_id", addState);
    router.put("/setResend/:id", setResend);
    router.get("/lastInsert/:terminal", getLastInsert);
    router.get("/byCode", getByCode);
    router.get("/byContainer", getByContainer);
    router.get("/byContainerTotales", getTotalByContainer);
    router.get("/header_detail", getHeaderDetail)
    //	app.get('/invoices/log/:seconds', function( req, res) {
    //		logInvoiceBody = 1;
    //		log.logger.info("Loguear invoiceBody en insert Habilitado.")
    //
    //		setTimeout(function(){
    //			log.logger.info("Loguear invoiceBody en insert Deshabilitado.")
    //			logInvoiceBody = 0;
    //		}, req.params.seconds);
    //
    //		res.status(200).send();
    //	})
    return router;
};
