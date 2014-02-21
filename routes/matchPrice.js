/**
 * Created by Diego Reyes	on 2/18/14.
 */
'use strict';

module.exports = function (app){

	var matchPrice = require('../models/matchPrice.js');
	var price = require('../models/price.js');

	function getMatchPrices (req, res){
		'use strict';

		price.find()
		.populate({path:'match', match:{"codes.terminal":req.params.terminal}})
		.exec(function (err, prices) {
			if(!err) {
				res.send(prices);
			} else {
				console.log('ERROR: ' + err);
			}
		});
	}

	function addMatchPrice (req, res){
		'use strict';

		var matchprice = new matchPrice(req.body);

		price.findOne({_id: matchprice._id}, function(err, item){
			if(!err) {
				if (item){
					matchprice.save(function (err){
						if(!err) {
							console.log('matchprice Created');
							item.match = matchprice._id;
							item.save(function(){
								console.log('price Updated');
								res.send(matchprice);
							})
						} else {
							console.log('ERROR: ' + err);
						}
					});
				}
			} else {
				console.log('ERROR: ' + err);
			}
		})

	}

	app.get('/agp/matchprices/:terminal', getMatchPrices);
	app.post('/agp/matchprice', addMatchPrice);
	app.put('/agp/matchprice', addMatchPrice);

};
