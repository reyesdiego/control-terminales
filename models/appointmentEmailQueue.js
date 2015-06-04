/**
 * Created by diego on 6/1/15.
 */

var mongoose = require('mongoose'),
    appointmentEmailQueue;

appointmentEmailQueue = new mongoose.Schema({
    status: {type: Number, require: true},
    date: {type: Date},
    terminal: {
        description: {type: String}
    },
    appointment: {type: mongoose.Schema.ObjectId, ref: 'appointments'}
});

module.exports = mongoose.model('appointmentemailqueues', appointmentEmailQueue);
