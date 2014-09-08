/**
 * Created by Administrator on 1/10/14.
 */
var mongoose = require('mongoose'),
	Schema   = mongoose.Schema;

var invoiceSchema = new Schema({
	terminal:			{ type: String, required: true },
	codTipoComprob:		{ type: Number, required: true },
	nroPtoVenta:		{ type: Number },
	nroComprob:			{ type: Number, required: true },
	codTipoAutoriz:		{ type: String },
	codAutoriz:			{ type: Number },
	codTipoDoc:			{ type: Number },
	nroDoc:				{ type: Number },
	clientId:			{ type: String },
	razon:				{ type: String, required: true },
	importe:			{
							gravado:		{ type: Number },
							noGravado:		{ type: Number },
							exento:			{ type: Number },
							iva:			{ type: Number },
							subtotal:		{ type: Number },
							otrosTributos:	{ type: Number },
							total:			{ type: Number, required: true }
	},
	codMoneda:			{ type: String, required: true, enum: ['PES', 'DOL', 'EUR'] },
	cotiMoneda:			{ type: Number, required: true, min: 1 },
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
					id:			{type: String, required: true},
					cnt:		{type: Number, required: true},
					uniMed:		{type: String},
					impUnit:	{type: Number, required: true},
					impTot:		{type: Number, required: true}
				}
			]
		}
	],
	otrosTributos:	[{
					id:				{type: Number},
					desc	:		{type: String},
					imponible:		{type: Number},
					imp:			{type: Number}
				}],
	estado	: {type: String, default: 'Y', enum: ['R', 'Y', 'G']},
	comment	: [{ type: mongoose.Schema.ObjectId, ref: 'comments' }]
});

invoiceSchema.index({nroPtoVenta:1, codTipoComprob:1, nroComprob:1, terminal:1}, {unique:true});

module.exports = mongoose.model('invoice', invoiceSchema);