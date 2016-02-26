/**
 * Created by diego on 2/10/16.
 */
//var mongoose = require('mongoose')
//    , Schema = mongoose.Schema
//
//var personSchema = Schema({
//    _id     : Number,
//    name    : String,
//    age     : Number,
//    stories : [{ type: Schema.Types.ObjectId, ref: 'Story' }]
//});
//
//var storySchema = Schema({
//    _creator : { type: Number, ref: 'Person' },
//    title    : String,
//    fans     : [{ type: Number, ref: 'Person' }]
//});
//
//var Story  = mongoose.model('Story', storySchema);
//var Person = mongoose.model('Person', personSchema);

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://localhost/terapi');

var header = new mongoose.Schema({
    terminal:		{type: String},
    razon: 		{type: String},
    comment :		 [{ type: mongoose.Schema.ObjectId, ref: 'comments' }]
});

var Header = mongoose.model('invoices', header);

var detail = new mongoose.Schema({
    title:		{type: String},
    invoice :		 { type: mongoose.Schema.ObjectId, ref: 'invoices' }
});

var Detail = mongoose.model('comments', detail);


Header.find({"terminal" : "TERMINAL4",
    "nroPtoVenta" : 5,
    "codTipoComprob" : 1,
    "nroComprob" : 150794})
    .populate('comment')
    .exec(function (err, items) {
    console.log(items);
})

/*
Detail.find({_id: "54a16d9e9d2124c15b000b43"})
    .populate('invoice')
    .exec(function (err, items) {
        console.log(items);
    })
*/