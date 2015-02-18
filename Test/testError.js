/**
 * Created by diego on 2/11/15.
 */




try {

	var json =	'{"l": 9}';
	json = JSON.parse(json);

	console.log(json);
} catch (e) {
	console.error(e);
}