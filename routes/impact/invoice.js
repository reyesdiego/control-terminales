/**
 * Created by diego on 7/3/15.
 */
module.exports = function (log, io) {
    'use strict';

    var express = require('express'),
        router = express.Router(),
        util = require('util'),
        mail = require("../../include/emailjs"),
        dateTime = require('../../include/moment'),
        moment = require('moment'),
        config = require('../../config/config.js'),
        Invoice = require('../../models/invoice.js'),
        Comment = require('../../models/comment.js'),
        logInvoiceBody = false;

    function addInvoice(req, res) {

        var usr = req.usr;

        var postData = '';

        req.addListener("data", function(postDataChunk) {
            postData += postDataChunk;
        });
        req.addListener("end", function() {

            var contentTypeExists = req.headers["content-type"].toLowerCase().indexOf("text/plain");
            if (contentTypeExists === -1){
                var errMsg = util.format("El content-type:%s es incorrecto. Debe enviar text/plain. %s", req.headers["content-type"], usr.terminal);
                log.logger.error(errMsg);
                res.status(400).send(errMsg);
                return;
            }

            try {
                if (logInvoiceBody === 1)
                    log.logger.info("Invoice body INS: %s - %s", postData, usr.terminal);

                postData = JSON.parse(postData);
            } catch (errParsing){
                var strBody = util.format("Parsing JSON: [%s], JSON:%s", errParsing.toString(), postData);
                var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                log.logger.error(strBody);
                var mailer = new mail.mail(config.email);
                mailer.send(usr.email, strSubject, strBody);
                res.status(500).send({status:"ERROR", data: strBody} );
                return;
            }

            _addInvoice(res, postData, usr, function(statusHttp, object){
                res.status(statusHttp).send(object);
            });
        });
    }

    function _addInvoice(res, postData, usr, callback) {
        var invoice;

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
                    gravado: postData.impGrav,
                    noGravado: postData.impNoGrav,
                    exento: postData.impExento,
                    subtotal: postData.impSubtot,
                    iva: postData.impIva,
                    otrosTributos: postData.impOtrosTrib,
                    total: postData.impTotal
                },
                codMoneda: postData.codMoneda,
                cotiMoneda: postData.cotiMoneda,
                observa: postData.observa,
                codConcepto: postData.codConcepto,
                fecha: {
                    emision: moment(postData.fechaEmision),
                    vcto: moment(postData.fechaVcto),
                    desde: moment(postData.fechaServDesde),
                    hasta: moment(postData.fechaServHasta),
                    vctoPago: moment(postData.fechaVctoPago)
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

            if (postData.otrosTributos){
                postData.otrosTributos.forEach(function (item) {

                    var otId = (item.id !== undefined) ? item.id.toString() : null;
                    var otDesc = item.desc;
                    invoice.otrosTributos.push(
                        {
                            id: (otId) ? otId : "",
                            desc: (otDesc) ? otDesc.trim() : "",
                            imponible: item.imponible,
                            imp: item.imp
                        })
                });
            }

            var subTotalCheck=0;
            if ( postData.detalle && postData.detalle.length > 0 ){
                postData.detalle.forEach(function (container){
                    var buqueId = (container.buqueId !== undefined && container.buqueId !== null) ? container.buqueId.toString() : "";
                    var buqueDesc = container.buqueDesc;
                    var viaje = container.viaje;
                    var fecha = (container.fecha !== undefined && container.fecha !== "" && container.fecha != null) ? moment(container.fecha) : "";
                    var buque = {
                        codigo: (buqueId) ? buqueId.trim() : "",
                        nombre: (buqueDesc) ? buqueDesc.trim() : "",
                        viaje: (viaje) ? viaje.trim() : "",
                        fecha: fecha
                    };

                    var contenedor = container.contenedor;
                    var cont = {
                        contenedor:		(contenedor) ? container.contenedor.trim() : "",
                        IMO:			container.IMO,
                        buque:			buque,
                        items: []
                    };
                    if (container.items){
                        container.items.forEach( function (item){
                            cont.items.push(
                                {
                                    id:			item.id,
                                    cnt:		Math.abs(item.cnt),
                                    uniMed:		item.uniMed,
                                    impUnit:	item.impUnit,
                                    impTot:		Math.abs(item.impTot)
                                });
                            subTotalCheck += item.impTot;
                        });
                    } else {
                        var errMsg = util.format("Invoice INS: %s", "El contenedor no posee items.");
                        log.logger.error(errMsg);
                        callback(500, {status:"ERROR", data: errMsg});
                        return;
                    }
                    invoice.detalle.push(cont);
                });

            } else {
                var errMsg = util.format("Invoice INS: %s - %s. - %j", "El comprobante no posee detalles.", usr.terminal, postData);
                log.logger.error(errMsg);
                callback(500, {status:"ERROR", data: errMsg});
            }

        } catch (error){
            var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
            var body = util.format('Error al insertar comprobante. %s. \n%s',  error.message, JSON.stringify(postData));

            log.logger.error(body);

            var mailer = new mail.mail(config.email);
            mailer.send(usr.email, strSubject, body, function(){
            });
            callback(500, {"status":"ERROR", "data": body});
        }

        var invoice2add = new Invoice(invoice);
        invoice2add.save( function (errSave, data) {
            var socketMsg;
            if (!errSave) {
                log.logger.insert("Invoice INS: %s - %s - Tipo: %s Nro: %s - %s", data._id, usr.terminal, postData.codTipoComprob, postData.nroComprob, postData.fechaEmision);

                socketMsg = {
                    status:'OK',
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

                if ( ( subTotalCheck > postData.impSubtot + 2) || ( subTotalCheck < postData.impSubtot - 2) ){
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
                }, function (err, commentAdded){
                    if (err){

                    } else {
                        data.comment.push(commentAdded._id);
                        data.save(function (){
                            callback(200,{status: "OK", data: data});
                        });
                    }
                });

            } else {
                //TODO crear objecto para tratar los errores, en este caso trato el tema de duplicados.
                if (errSave.code === 11000){
                    Invoice.find({
                        terminal:		usr.terminal,
                        codTipoComprob:	invoice.codTipoComprob,
                        nroComprob:		invoice.nroComprob,
                        nroPtoVenta:	invoice.nroPtoVenta
                    }, function (err, invoices){

                        var estado = invoices[0].estado[invoices[0].estado.length-1].estado;
                        if (estado === 'E'){
                            Invoice.remove({_id : invoices[0]._id}, function (err, delInvoice){
                                log.logger.delete('Se eliminó el comprobante %s para ser retransferido.', invoices[0]._id.toString());
                                Comment.remove({invoice: invoices[0]._id}, function (errComment, delComment){
                                    _addInvoice(res, postData, usr, function (statusHttp, object){
                                        res.status(statusHttp).send(object);
                                    });
                                });
                            });
                        } else {
                            var errMsg = util.format('Error INS: El tipo de comprobante: %s, número: %s, fue transferido el %s:\n %s\n\n%s - ERROR:%s', invoices[0].codTipoComprob, invoices[0].nroComprob, dateTime.getDateTimeFromObjectId(invoices[0]._id), invoices[0], moment(), errSave);
                            var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                            log.logger.error(errMsg, { data: postData});

//  Envia email cuando recibe duplicado, por ahora comentado
//							var mailer = new mail.mail(config.email);
//							mailer.send(usr.email, strSubject, errMsg, function(){
//							});

                            return callback(500, {status: "ERROR", data: errMsg});
                        }

                    });
                } else {
                    var strSubject = util.format("AGP - %s - ERROR", usr.terminal);
                    var strError = util.format('Invoice INS: %s -\n%s - %s', errSave, JSON.stringify(postData), usr.terminal);
                    log.logger.error(strError);

                    var mailer = new mail.mail(config.email);
                    mailer.send(usr.email, strSubject, strError, function(){
                    });

                    return callback(500, {status: "ERROR", data: strError});
                }
            }
        });
    }

    /*
     router.use(function timeLog(req, res, next){
     log.logger.info('Time: %s', Date.now());
     next();
     });
     */

    router.post('/', addInvoice);

    return router;
};