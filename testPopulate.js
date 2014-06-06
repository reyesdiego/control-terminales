var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://localhost/terapi', {
	user: 'admin',
	pass: 'desarrollo',
	auth:{authdb:"admin"}
});

var UserSchema = new Schema({
	name: String
});

var MovieSchema = new Schema({
	title: String,
//	tags: [new Schema({
//		_name: {type: Schema.ObjectId, ref: 'Tag'},
//		_owner: {type: Schema.ObjectId, ref: 'User'}
//	})]
	tags: [{type: Schema.ObjectId, ref: 'Tag'}]
});

var TagSchema = new Schema({
	name: String
});

var Tag = mongoose.model('Tag', TagSchema),
	User = mongoose.model('User', UserSchema),
	Movie = mongoose.model('Movie', MovieSchema);

//User.create({name: 'Johnny'}, function(err, johnny) {
//	Tag.create({name: 'drama'}, function(err, drama) {
//		Movie.create({'title': 'Dracula',
////			tags:[{_name: drama._id, _owner: johnny._id}]}, function(err, movie) {
//			tags:[johnny._id]}, function(err, movie) {
//
////			Movie.findById(movie).populate('tags._owner').exec(function(err, movie) {
//			Movie.findById(movie).populate('tags').exec(function(err, movie) {
//				console.log(movie);
//			});
//		});
//	});
//});


//Movie.find({"title" : "Dracula"}).populate('tags').exec(function(err, movie) {
//	console.log(movie);
//});

var Price = require('./models/price.js');

var param = {terminal:'AGP',
	rate:{'$exists' : 1},
	'matches': {'$exists' : 1}
};

Price.find(param, function (err, prices){
	console.log(prices);
});


