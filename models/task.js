/**
 * Created by diego on 5/13/15.
 */

var mongoose = require('mongoose');

var Task = new mongoose.Schema({
    description : {type: String, require: true},
    route: {type: String, require: true},
    role: {type: String}
});

module.exports = mongoose.model('tasks', Task);