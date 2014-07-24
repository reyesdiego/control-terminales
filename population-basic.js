
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

console.log('Running mongoose version %s', mongoose.version);

/**
 * Console schema
 */

var consoleSchema = Schema({
	_id: String,
    name: String
  , manufacturer: String
  , released: Date
})
var Console = mongoose.model('Console', consoleSchema);

/**
 * Game schema
 */

var gameSchema = Schema({
    name: String
  , developer: String
  , released: Date
  , consoles: [{ type: String, ref: 'Console' }]
})
var Game = mongoose.model('Game', gameSchema);

var T4Sch = Schema({
	MATCH : {type: String},
	CODE : {type: String}
})

var Tcuatro = mongoose.model('Tcuatros', T4Sch);

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 */

mongoose.connect('mongodb://localhost/terapi', function (err) {
  // if we failed to connect, abort
  if (err) throw err;

  // we connected ok
  createData();
})

/**
 * Data generation
 */

function createData () {
	Tcuatro.find({}, function (err, data){
		console.log(data);
	});

  Console.create({
	  _id:"NIN",
      name: 'Nintendo 64'
    , manufacturer: 'Nintendo'
    , released: 'September 29, 1996'
  }, function (err, nintendo64) {
    if (err) return done(err);

    Game.create({
        name: 'Legend of Zelda: Ocarina of Time'
      , developer: 'Nintendo'
      , released: new Date('November 21, 1998')
      , consoles: ["NIN"]
    }, function (err) {
      if (err) return done(err);
      example();
    })
  })
}

/**
 * Population
 */

function example () {
  Game
  .findOne({ name: /^Legend of Zelda/ })
//  .populate('consoles')
  .exec(function (err, ocinara) {
    if (err) return done(err);

    console.log(
        '"%s" was released for the %s on %s'
      , ocinara.name
      , ocinara.consoles[0].name
      , ocinara.released.toLocaleDateString());

    done();
  })
}

function done (err) {
  if (err) console.error(err);
  Console.remove(function () {
    Game.remove(function () {
      mongoose.disconnect();
    })
  })
}
