/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log, io, oracle) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require('util'),
        mail = require("../../include/emailjs"),
        moment = require('moment'),
        config = require('../../config/config.js'),
        Invoice = require('../../models/invoice.js'),
        logInvoiceBody = false;

    function validateSanitize (req, res, next) {
        var errors,
            Validr = require('../../include/validation.js'),
            validate = new Validr.validation(req.postData);

        validate
            .validate('fechaEmision', {
                isLength: 'fechaEmision is required.',
                isDate: 'fechaEmision must be a valid date.'
            })
            .isLength(1)
            .isDate();
        validate
            .validate('fechaVcto', 'fechaVcto must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('fechaServDesde', 'fechaServDesde must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('fechaServHasta', 'fechaServHasta must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('fechaVctoPago', 'fechaVctoPago must be a valid date.', {ignoreEmpty: true})
            .isDate();
        validate
            .validate('nroComprob', {
                isNumeric: 'nroComprob must be integer greater or equal to 0.',
                isInt: 'nroComprob must be integer greater or equal to 0.',
                isLength: 'nroComprob is required.'
            })
            .isNumeric()
            .isInt({min: 0})
            .isLength(1);
        validate
            .validate('codTipoComprob', {
              //  isInt: 'codTipoComprob must be integer',
                isLength: 'codTipoComprob is required.'
            })
            //.isInt({min: 0})
            .isLength(1);
        validate
            .validate('nroPtoVenta', 'nroPtoVenta is required.', {ignoreEmpty: true})
            .isInt({min: 0});
        validate
            .validate('nroDoc', 'nroDoc is required.', {ignoreEmpty: true})
            .isInt({min: 0});
        validate
            .validate('razon', 'razon is required.')
            .isLength(1)
            .trim();
        validate
            .validate('codMoneda', {
                isLength: 'codMoneda is required.',
                isIn: 'codMoneda must be in "PES" or "DOL" or "EUR" values'
            })
            .isLength(1)
            .isIn(['PES', 'DOL', 'EUR']);
        validate
            .validate('cotiMoneda', {
                isLength: 'cotiMoneda is required.',
                isFloat: 'cotiMoneda must be a float greater equal than 1'
            })
            .isLength(1)
            .isFloat({min: 1});

        validate
            .validate('impGrav', 'impGrav must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impNoGrav', 'impNoGrav must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impExento', 'impExento must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impIva', 'impIva must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impOtrosTrib', 'impOtrosTrib must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impSubtot', 'impSubtot must be a float.', {ignoreEmpty: true})
            .isFloat();
        validate
            .validate('impTotal', {
                isLength: 'impTotal is required.',
                isFloat: 'impTotal must be a float.'
            })
            .isLength(1)
            .isFloat();

        errors = validate.validationErrors();
        if (errors) {
            res.status(400).send({
                status: "ERROR",
                message: "Error en la validacion del Invoice",
                data: util.inspect(errors)
            });
        } else {
            next();
        }

    }

    function receiveInvoice(req, res, next) {

        var postData = '',
            mailer,
            strBody,
            strSubject,
            errMsg,
            contentTypeExists;

        contentTypeExists = req.headers["content-type"].toLowerCase().indexOf("text/plain");
        if (contentTypeExists === -1) {
            errMsg = util.format("El content-type:%s es incorrecto. Debe enviar text/plain. %s", req.headers["content-type"], req.usr.terminal);
            log.logger.error(errMsg);
            res.status(400).send(errMsg);
        } else {
            req.addListener("data", function(postDataChunk) {
                postData += postDataChunk;
            });
            req.addListener("end", function () {

                try {
                    if (logInvoiceBody === 1) {
                        log.logger.info("Invoice body INS: %s - %s", postData, req.usr.terminal);
                    }

                    req.postData = JSON.parse(postData);
                    req.postData.usr = req.usr;
                    next();

                } catch (errParsing) {
                    strBody = util.format("Parsing JSON: [%s], JSON:%s", errParsing.toString(), postData);
                    strSubject = util.format("AGP - %s - ERROR", req.usr.terminal);

                    log.logger.error(strBody);
                    mailer = new mail.mail(config.email);
                    mailer.send(req.usr.email, strSubject, strBody);
                    res.status(500).send({status: "ERROR", data: strBody});
                }

            });
        }

    }

/*
    function addInvoice(req, res) {
        var invoice,
            errMsg,
            subTotalCheck,
            usr = req.usr,
            postData = req.postData,
            strSubject,
            body,
            buqueId,
            buqueDesc,
            viaje,
            fecha,
            buque,
            contenedor,
            cont,
            mailer,
            invoice2add;

        try {
            invoice = {
                terminal: usr.terminal,

                nroPtoVenta: postData.nroPtoVenta,
                codTipoComprob: parseInt(postData.codTipoComprob.toString().trim(), 10),
                nroComprob: postData.nroComprob,
                codTipoAutoriz: postData.codTipoAutoriz,
                codAutoriz: postData.codAutoriz,
                codTipoDoc: postData.codTipoDoc,
                nroDoc: postData.nroDoc,
                clienteId: postData.clientId,
                razon: postData.razon.trim(),
                importe: {
                    gravado: Math.abs(postData.impGrav),
                    noGravado: Math.abs(postData.impNoGrav),
                    exento: Math.abs(postData.impExento),
                    subtotal: Math.abs(postData.impSubtot),
                    iva: Math.abs(postData.impIva),
                    otrosTributos: postData.impOtrosTrib,
                    total: Math.abs(postData.impTotal)
                },
                codMoneda: postData.codMoneda,
                cotiMoneda: postData.cotiMoneda,
                observa: postData.observa,
                codConcepto: postData.codConcepto,
                fecha: {
                    emision: moment(postData.fechaEmision, "YYYY-MM-DDT00:00:00.000.Z"),
                    vcto: moment(postData.fechaVcto, "YYYY-MM-DDT00:00:00.000.Z"),
                    desde: moment(postData.fechaServDesde, "YYYY-MM-DDT00:00:00.000.Z"),
                    hasta: moment(postData.fechaServHasta, "YYYY-MM-DDT00:00:00.000.Z"),
                    vctoPago: moment(postData.fechaVctoPago, "YYYY-MM-DDT00:00:00.000.Z")
                },
                detalle: [],
                otrosTributos: [],
                estado: [
                    {
                        estado: "Y",
                        grupo: "ALL",
                        user: usr.user
                    }
                ],
                comment: []
            };

            if (postData.otrosTributos) {
                postData.otrosTributos.forEach(function (item) {

                    var otId = (item.id !== undefined) ? item.id.toString() : null;
                    var otDesc = item.desc;

                    invoice.otrosTributos.push(
                        {
                            id: (otId) ? otId : "",
                            desc: (otDesc) ? otDesc.trim() : "",
                            imponible: Math.abs(item.imponible),
                            imp: item.imp
                        });
                });
            }

            subTotalCheck = 0;
            if (postData.detalle && postData.detalle.length > 0) {
                postData.detalle.forEach(function (container) {
                    buqueId = (container.buqueId !== undefined && container.buqueId !== null) ? container.buqueId.toString() : "";
                    buqueDesc = container.buqueDesc;
                    viaje = container.viaje;
                    fecha = (container.fecha !== undefined && container.fecha !== "" && container.fecha != null) ? moment(container.fecha, "YYYY-MM-DD") : "";
                    buque = {
                        codigo: (buqueId) ? buqueId.trim() : "",
                        nombre: (buqueDesc) ? buqueDesc.trim() : "",
                        viaje: (viaje) ? viaje.trim() : "",
                        fecha: fecha
                    };

                    contenedor = container.contenedor;
                    cont = {
                        contenedor: (contenedor) ? container.contenedor.trim() : "",
                        IMO: container.IMO,
                        buque: buque,
                        items: []
                    };
                    if (container.items) {
                        container.items.forEach(function (item) {
                            cont.items.push(
                                {
                                    id: item.id,
                                    cnt: Math.abs(item.cnt),
                                    uniMed: item.uniMed,
                                    impUnit: item.impUnit,
                                    impTot: Math.abs(item.impTot)
                                });
                            subTotalCheck += Math.abs(item.impTot);
                        });
                    } else {
                        errMsg = util.format("Invoice INS: %s", "El contenedor no posee items.");
                        log.logger.error(errMsg);
                        res.status(500).send({
                            status: "ERROR",
                            message: errMsg,
                            data: errMsg
                        });
                        return;
                    }
                    invoice.detalle.push(cont);
                });

            } else {
                errMsg = util.format("Invoice INS: %s - %s. - %j", "El comprobante no posee detalles.", usr.terminal, postData);
                log.logger.error(errMsg);
                res.status(500).send({
                    status: "ERROR",
                    message: errMsg,
                    data: errMsg
                });
            }

        } catch (error) {
            strSubject = util.format("AGP - %s - ERROR", usr.terminal);
            body = util.format('Error al insertar comprobante. %s. \n%s',  error.message, JSON.stringify(postData));

            log.logger.error(body);

            mailer = new mail.mail(config.email);
            mailer.send(usr.email, strSubject, body, function () {
            });
            res.status(500).send({
                status: "ERROR",
                message: body,
                data: body
            });
        }

        invoice2add = new Invoice(invoice);
        invoice2add.save(function (errSave, data) {
            var socketMsg;
            if (!errSave) {
                log.logger.insert("Invoice INS: %s - %s - Tipo: %s Nro: %s - %s", data._id, usr.terminal, postData.codTipoComprob, postData.nroComprob, postData.fechaEmision);

                socketMsg = {
                    status: 'OK',
                    data : {
                        terminal : data.terminal,
                        _id: data._id,
                        emision : data.fecha.emision,
                        codTipoComprob : data.codTipoComprob,
                        razon: data.razon,
                        nroComprob: data.nroComprob,
                        total: data.importe.total
                    }
                };
                io.sockets.emit('invoice', socketMsg);

                var comment = 'Comprobante transferido correntamente.';
                var commentState = 'Y';

                if ((subTotalCheck > postData.impSubtot + 2) || (subTotalCheck < postData.impSubtot - 2)) {
                    comment = util.format("El subtotal del comprobante es incorrecto, la suma es %d y se informa %d. - %s.", subTotalCheck, postData.impSubtot, usr.terminal);
                    data.estado[0].estado = 'T';
                }

                Comment.create({
                    invoice: data._id,
                    title: 'Transferencia comprobante.',
                    comment: comment,
                    state: commentState,
                    user: usr.user,
                    group: "ALL"
                }, function (err, commentAdded) {
                    if (err) {

                    } else {
                        data.comment.push(commentAdded._id);
                        data.save(function () {
                            res.status(200).send({
                                status: "OK",
                                data: data
                            });
                        });
                    }
                });

            } else {
                //TODO crear objecto para tratar los errores, en este caso trato el tema de duplicados.
                if (errSave.code === 11000) {
                    Invoice.find({
                        terminal: usr.terminal,
                        codTipoComprob: invoice.codTipoComprob,
                        nroComprob: invoice.nroComprob,
                        nroPtoVenta: invoice.nroPtoVenta
                    }, function (err, invoices) {

                        var estado = invoices[0].resend;
                        if (estado === 1) {
                            Invoice.remove({_id : invoices[0]._id}, function (err, delInvoice) {
                                log.logger.delete('Se eliminó el comprobante %s para ser retransferido.', invoices[0]._id.toString());
                                Comment.remove({invoice: invoices[0]._id}, function (errComment, delComment) {
                                    addInvoice(req, res);
                                });
                            });
                        } else {
                            errMsg = util.format('Error INS: El tipo de comprobante: %s, número: %s, fue transferido el %s:\n %s\n\n%s - ERROR:%s', invoices[0].codTipoComprob, invoices[0].nroComprob, dateTime.getDateTimeFromObjectId(invoices[0]._id), invoices[0], moment(), errSave);
                            log.logger.error(errMsg, { data: postData});

                            res.status(500).send({
                                status: "ERROR",
                                message: "Error insertando Comprobante",
                                data: errMsg
                            });
                        }

                    });
                } else {
                    strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                    errMsg = util.format('Invoice INS: %s -\n%s - %s', errSave, JSON.stringify(postData), usr.terminal);
                    log.logger.error(errMsg);

                    mailer = new mail.mail(config.email);
                    mailer.send(usr.email, strSubject, errMsg, function () {
                    });
                    res.status(500).send({
                        status: "ERROR",
                        data: errMsg
                    });
                }
            }
        });
    }
*/

    function add (req, res) {
        var Invoice = require('../../lib/invoice2.js');
        var InvoiceM,
            InvoiceO;

        var paramMongo = JSON.parse(JSON.stringify(req.postData));
        var paramOracle = JSON.parse(JSON.stringify(req.postData));

        InvoiceM = new Invoice();
        InvoiceM.add(paramMongo, io, function (err, data) {
            if (err) {
                log.logger.error("Invoice INS: %s", err.data);
                res.status(500).send(err);
            } else {
                let result = data;
                data = data.data;
                log.logger.insert("Invoice INS: %s - %s - Tipo: %s Nro: %s - %s", data._id, data.terminal, data.codTipoComprob, data.nroComprob, data.fecha.emision.toString());
                res.status(200).send(result);
            }
        });


        InvoiceO = new Invoice(oracle);
        InvoiceO.add(paramOracle, io, function (err, data) {
            if (err) {
                log.logger.error("%s", err);
                //res.status(500).send(err);
            } else {
                let result = data;
                data = data.data;
                log.logger.insert("Invoice ORA INS: %s - %s - Tipo: %s Nro: %s - %s", data._id, data.terminal, data.codTipoComprob, data.nroComprob, data.fechaEmision.toString());
console.log(result)
                //res.status(200).send(result);
            }
        });

    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

//    router.post('/', receiveInvoice, validateSanitize, addInvoice);
    router.post('/', receiveInvoice, validateSanitize, add);

    return router;
};