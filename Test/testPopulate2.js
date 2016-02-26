var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://localhost/terapi');

var price = new mongoose.Schema({
	terminal:		{type: String},
	code:			{type: String},
	description:	{type: String},
	unit:			{type: String},
	currency:		{type: String},
	topPrice:		{type: Number},
	matches :		 [{ type: mongoose.Schema.ObjectId, ref: 'matchprices' }]
});

var Price = mongoose.model('prices', price);

var matchPrice = new mongoose.Schema({
	terminal:	{type: String},
	code:		{type: String},
	match:		[{type: String}],
	price:		{type: mongoose.Schema.ObjectId, ref:'prices'}
});

var MatchPrice = mongoose.model('matchprices', matchPrice);


//MatchPrice.create({terminal: 'BACTSSA', code:'diego'}, function(err, miprice) {
//	Price.create({code: 'diego', matches:[miprice._id]}, function(err, mimatch) {
//		//console.log(mimatch);
//	})
//})


Price.find({code:"TCI"}).populate('matches').exec(function(err, movie) {
	console.log("%j",movie[0]);
});




//Price.find().populate('matches').exec(function(err, movie) {
//	console.log(movie[0]);
//});

