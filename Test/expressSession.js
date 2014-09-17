/**
 * Created by Administrator on 1/16/14.
 * http://www.9bitstudios.com/2013/09/express-js-authentication/
 */
var express = require('express');
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser('shhhh, very secret'));
app.use(express.session());


function restrict(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		req.session.error = 'Access denied!';
		res.send("Access denied");
		//res.redirect('/login');
	}
}

app.get('/', function(request, response) {
	response.send('This is the homepage');
});

app.get('/login', function(request, response) {
	response.send('<form method="post" action="/login">' +
		'<p>' +
		'<label>Username:</label>' +
		'<input type="text" name="username">' +
		'</p>' +
		'<p>' +
		'<label>Password:</label>' +
		'<input type="text" name="password">' +
		'</p>' +
		'<p>' +
		'<input type="submit" value="Login">' +
		'</p>' +
		'</form>');
});

app.post('/login', function(request, response) {

	var username = request.body.username;
	var password = request.body.password;

	if(username == 'demo' && password == 'demo'){
		request.session.regenerate(function(){
			request.session.user = username;
			response.redirect('/restricted');
		});
	}
	else {
		response.redirect('login');
	}
});

app.get('/logout', function(request, response){
	request.session.destroy(function(){
		response.redirect('/');
	});
});

app.get('/restricted', restrict, function(request, response){
	response.send('This is the restricted area! Hello ' + request.session.user + '! click <a href="/logout">here to logout</a>');
});

app.listen(8124, function(){
	console.log('Server running...');
});