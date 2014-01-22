/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose'),
	Schema   = mongoose.Schema;

var invoiceSchema = new Schema({
	codigoTipoComprobante:	{ type: Number },
	numeroPuntoVenta:		{ type: Number },
	numeroComprobante:		{ type: Number },
	fechaEmision:			{ type: Date },
	codigoTipoAutorizacion:	{ type: String },
	codigoAutorizacion:		{ type: Number },
	fechaVencimiento:		{ type: Date },
	codigoTipoDocumento:    { type: Number },
	numeroDocumento: 	    { type: Number },
	importeGravado:			{ type: Number },
	importeNoGravado:		{ type: Number },
	importeExento:			{ type: Number },
	importeSubtotal:		{ type: Number },
	importeOtrosTributos:	{ type: Number },
	importeTotal:			{ type: Number },
	codigoMoneda:			{ type: String, enum:
		['PES', 'DOL', 'EUR'] },
	cotizacionMoneda: 		{ type: Number },
	observaciones: 			{ type: String },
	codigoConcepto: 		{ type: Number },
	fechaServicioDesde:		{ type: Date },
	fechaServicioHasta:		{ type: Date },
	fechaVencimientoPago:	{ type: Date },
	details:				[{
									unidadesMtx:		{type: Number},
									codigoMtx:			{type: String},
									codigo:				{type: String},
									descripcion:		{type: String},
									cantidad:			{type: Number},
									codigoUnidadMedida:	{type: Number},
									precioUnitario:		{type: Number},
									importeBonificacion:{type: Number},
									codigoCondicionIva:	{type: Number},
									importeIva:			{type: Number},
									importeItem:		{type: Number}
							}]
});

module.exports = mongoose.model('Invoice', invoiceSchema);