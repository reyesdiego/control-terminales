/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose'),
	Schema   = mongoose.Schema;

var invoiceSchema = new Schema(
	{
	terminal:				{ type: String, required: true },
	codTipoComprob:			{ type: Number },
	nroPtoVenta:			{ type: Number },
	nroComprob:				{ type: Number, required: true },
	codTipoAutoriz:			{ type: String },
	codAutoriz:				{ type: Number },
	fechaVto:				{ type: Date },
	codTipoDoc:				{ type: Number },
	nroDoc:					{ type: Number },
	importe:				{
								Gravado:		{ type: Number },
								NoGravado:		{ type: Number },
								Exento:			{ type: Number },
								Subtotal:		{ type: Number },
								OtrosTributos:	{ type: Number },
								Total:			{ type: Number, required: true }
	},
	codMoneda:				{ type: String, enum: ['PES', 'DOL', 'EUR'] },
	cotiMoneda:				{ type: Number },
	observa:	 			{ type: String },
	codConcepto:			{ type: Number },
	fecha:{
		Emision:			{ type: Date },
		Desde:				{ type: Date },
		Hasta:				{ type: Date },
		VtoPago:			{ type: Date }
	},
	buque:					{
								codigo:	{ type: String },
								nombre:	{ type: String },
								viaje:	{ type: String }
							},
	detalle:[
		{
								contenedor:			{type: String},
								items:[
									{
										id:			{type: String, required: true},
										cnt:		{type: Number, required: true},
										uniMed:		{type: Number},
										impUni:		{type: Number},
										impIva:		{type: Number},
										impTot:		{type: Number}
									}
								]
		}
	],
	otrosTributos:			[{
								id:				{type: Number},
								desc	:		{type: String},
								imponible:		{type: Number},
								imp:			{type: Number}
							}]
});
invoiceSchema.index({numeroComprobante:1, terminal:1},{unique:true});

module.exports = mongoose.model('Invoice', invoiceSchema);