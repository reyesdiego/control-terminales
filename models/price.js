/**
 * Created by Diego Reyes on 1/10/14.
 */
var mongoose = require('mongoose');

var price = new mongoose.Schema({
    terminal: {type: String, required: true},
    code: {type: String, required: true},
    description: {type: String, required: true},
    unit: {type: Number},
    matches: [{ type: mongoose.Schema.ObjectId, ref: 'matchprices' }],
    rate: {type: String},
    topPrices: [{
        from: {type: Date},
        price: {type: Number, required: true},
        currency: {type: String}
    }],
    largo: {type: Number},
    norma: {type: String},
    aud_user: {type: String},
    aud_time: {type: Date}
});

price.virtual('unitCurrency').get(function () {
    'use strict';

    var cur, unit;
    if (this.unit === 29) {
        unit = 'Tn';
    } else if (this.unit === 7) {
        unit = 'Unidad';
    } else {
        unit = 'Cajón';
    }

    if (this.currency === 'DOL') {
        cur = 'U$S';
    } else {
        cur = '$';
    }

    return cur + '/' + unit;
});

//price.set('toJSON', {virtuals: true,
//transform: function(doc, ret, options) {
//delete ret.id;
//delete ret.unit;
//delete ret.currency;
//delete ret.__v;
//return ret;
//}
//});

module.exports = mongoose.model('prices', price);