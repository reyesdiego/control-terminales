/**
 * Created by Diego Reyes	on 2/18/14.
 */
'use strict';

module.exports = function (app){

	var matchPrice = require('../models/matchPrice.js');

	function getMatchPrices (req, res){
		'use strict';

		matchPrice.find(function(err, matchPrices){
			if(!err) {
				res.send(matchPrices);
			} else {
				console.log('ERROR: ' + err);
			}
		});
	}

	function addMatchPrice (req, res){
		'use strict';

		var matchprice = new matchPrice(req.body);

		matchprice.save(function (err){
			if(!err) {
				console.log('Created');
				res.send(matchprice);
			} else {
				console.log('ERROR: ' + err);
			}
		});
	}

	app.get('/agp/matchprices', getMatchPrices);
	app.post('/agp/matchprice', addMatchPrice);

};
