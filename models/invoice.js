/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose'),
	Schema   = mongoose.Schema;

var invoiceSchema = new Schema({
	terminal:				{ type: String, required: true },
	codigoTipoComprobante:	{ type: Number },
	numeroPuntoVenta:		{ type: Number },
	numeroComprobante:		{ type: Number, required: true },
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
	importeTotal:			{ type: Number, required: true },
	codigoMoneda:			{ type: String, enum: ['PES', 'DOL', 'EUR'] },
	cotizacionMoneda: 		{ type: Number },
	observaciones: 			{ type: String },
	codigoConcepto: 		{ type: Number },
	fechaServicioDesde:		{ type: Date },
	fechaServicioHasta:		{ type: Date },
	fechaVencimientoPago:	{ type: Date },
	buque:					{
								codigo: { type: String },
								nombre:	{ type: String },
								viaje:	{ type: String }
							},
	details:				[{
								contenedor:			{type: String},
								unidadesMtx:		{type: Number},
								codigoMtx:			{type: String},
								codigo:				{type: String, required: true},
								descripcion:		{type: String, required: true},
								cantidad:			{type: Number, required: true},
								codigoUnidadMedida:	{type: Number},
								precioUnitario:		{type: Number},
								importeBonificacion:{type: Number},
								codigoCondicionIva:	{type: Number},
								importeIva:			{type: Number},
								importeItem:		{type: Number}
							}],
	otrosTributos:			[{
								descripcion:		{type: String},
								baseImponible:		{type: Number},
								importe:			{type: Number}
							}],
	subtotalesIva:			[{
								codigo:				{type: Number},
								importe:			{type: Number}
							}]
});
invoiceSchema.index({numeroComprobante:1, terminal:1},{unique:true});

module.exports = mongoose.model('Invoice', invoiceSchema);