/**
 * Created by diego on 3/25/15.
 */
var tesseract = require('node-tesseract');

// Recognize text of any language in any format
tesseract.process(__dirname + '/logoPUERTO.png',function(err, text) {
	if(err) {
		console.error(err);
	} else {
		console.log(text);
	}
});

// Recognize German text in a single uniform block of text and set the binary path
/*
var options = {
	l: 'deu',
	psm: 6,
	binary: '/usr/share/tesseract-ocr'
};

tesseract.process(__dirname + '/images.jpg', options, function(err, text) {
	if(err) {
		console.error(err);
	} else {
		console.log(text);
	}
});
*/