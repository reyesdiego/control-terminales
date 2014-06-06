/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose'),
	Schema   = mongoose.Schema;

var invoiceSchema = new Schema({
	terminal:			{ type: String, required: true },
	codTipoComprob:		{ type: Number },
	nroPtoVenta:		{ type: Number },
	nroComprob:			{ type: Number, required: true },
	codTipoAutoriz:		{ type: String },
	codAutoriz:			{ type: Number },
	codTipoDoc:			{ type: Number },
	nroDoc:				{ type: Number },
	clientId:			{ type: String },
	razon:				{ type: String },
	importe:			{
							gravado:		{ type: Number },
							noGravado:		{ type: Number },
							exento:			{ type: Number },
							iva:			{ type: Number },
							subtotal:		{ type: Number },
							otrosTributos:	{ type: Number },
							total:			{ type: Number }
	},
	codMoneda:			{ type: String, enum: ['PES', 'DOL', 'EUR'] },
	cotiMoneda:			{ type: Number },
	observa:	 		{ type: String },
	codConcepto:		{ type: Number },
	fecha:				{
							emision:	{ type: Date, required: true },
							vcto:		{ type: Date },
							desde:		{ type: Date },
							hasta:		{ type: Date },
							vctoPago:	{ type: Date }
	},
	detalle:[
		{
			contenedor:	{type: String},
			IMO:		{type: Number},
			buque:		{
							codigo:	{ type: String },
							nombre:	{ type: String },
							viaje:	{ type: String }
			},
			items:[
				{
					id:			{type: String},
					cnt:		{type: Number},
					uniMed:		{type: String},
					impUnit:	{type: Number},
					impIva:		{type: Number},
					impTot:		{type: Number}
				}
			]
		}
	],
	otrosTributos:	[{
					id:				{type: Number},
					desc	:		{type: String},
					imponible:		{type: Number},
					imp:			{type: Number}
				}]
});

invoiceSchema.index({nroPtoVenta:1, codTipoComprob:1, nroComprob:1, terminal:1}, {unique:true});

module.exports = mongoose.model('invoice', invoiceSchema);