/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose'),
	Schema   = mongoose.Schema;

var invoiceSchema = new Schema(
	{
	terminal:				{ type: String, required: true },
	codTipoComprob:			{ type: String },
	nroPtoVenta:			{ type: Number },
	nroComprob:				{ type: Number, required: true },
	fechaEmision:			{ type: Date },
	codTipoAutoriz:			{ type: String },
	codAutoriz:				{ type: Number },
	fechaVcto:				{ type: Date },
	codTipoDoc:				{ type: Number },
	nroDoc:					{ type: Number },
	importe:				{
								gravado:		{ type: Number },
								noGravado:		{ type: Number },
								exento:			{ type: Number },
								iva:			{ type: Number },
								subtotal:		{ type: Number },
								otrosTributos:	{ type: Number },
								total:			{ type: Number, required: true }
	},
	codMoneda:				{ type: String, enum: ['PES', 'DOL', 'EUR'] },
	cotiMoneda:				{ type: Number },
	observa:	 			{ type: String },
	codConcepto:			{ type: Number },
	fecha:{
		emision:			{ type: Date },
		vcto:				{ type: Date },
		desde:				{ type: Date },
		hasta:				{ type: Date },
		vctoPago:			{ type: Date }
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
										impUnit:	{type: Number},
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