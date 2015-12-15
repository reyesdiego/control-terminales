/**
 * Created by diego on 9/4/15.
 */

var mongoose = require('mongoose');

var ship = new mongoose.Schema({
    terminal: {type: String, required: true},
    ship: {type: String},
    trips: [{
        trip: {type: String},
        date: {type: Date}
    }]
});

module.exports = mongoose.model('ships', ship);
