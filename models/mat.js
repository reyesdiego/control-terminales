/**
 * Created by diego on 12/9/15.
 */

var mongoose = require('mongoose');

var mat = new mongoose.Schema({
    terminal: {type: String},
    year: {type: Number},
    mat: {type: Number},
    months: [{
        month: {type: String},
        date: {type: Date},
        mat: {type: Number},
        types: [{
            name: {type: String},
            rate: {type: Number}
        }]
    }]
});

mat.index({
    terminal : 1,
    year : 1
}, {unique: true});


module.exports = mongoose.model('mats', mat);