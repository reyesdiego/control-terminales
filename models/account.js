var mongoose = require('mongoose'),
	_ = require('underscore')._,
	Schema = mongoose.Schema,
	path = require('path'),
	config = require(path.join(__dirname, '..', '/config/config.js')),
	passportLocalMongoose = require('passport-local-mongoose'),
	crypto = require('crypto');
	jwt = require('jwt-simple'),
	tokenSecret = 'put-a-$Ecr3t-h3re';

var Token = new Schema({
    token: {type: String},
    date_created: {type: Date, default: Date.now}
});
Token.methods.hasExpired= function(){
    var now = new Date();
    return (now.getTime() - this.date_created.getTime()) > config.ttl;
};
var TokenModel = mongoose.model('Token', Token);

var Account = new Schema({
	email: { type: String, required: true, lowercase:true, index: { unique: true } },
	password: { type: String},
	terminal: {type: String, required: true, uppercase:true, enum: ['BACTSSA', 'TRP', 'TERMINAL4']},
	role: {type: String},
	full_name: {type: String, required: true},//TODO: break out first / last names
	date_created: {type: Date, default: Date.now},
	token: {type: Object},
	//For reset we use a reset token with an expiry (which must be checked)
	reset_token: {type: String},
	reset_token_expires_millis: {type: Number}
});
Account.plugin(passportLocalMongoose, {usernameField: 'email'});

Account.statics.encode = function(data) {
    return jwt.encode(data, tokenSecret);
};

Account.statics.decode = function(data) {
    return jwt.decode(data, tokenSecret);
};

Account.statics.verifyToken = function(incomingToken, cb) {
	var err;

	if (incomingToken !== undefined){
		try {
			var decoded = jwt.decode(incomingToken, tokenSecret);
		} catch (e){
			err = {error: 'Token decoding error.' + e.message};
			cb(err);
		}
		//Now do a lookup on that email in mongodb ... if exists it's a real user
		if (decoded && decoded.email) {
			this.findOne({email: decoded.email}, function(err, usr) {
				if(err || !usr) {
					err = {error: 'Issue finding user.'};
					cb(err);
				} else if (incomingToken === usr.token.token) {
					if (cb !== undefined){
						cb(false, {
							terminal: usr.terminal,
							email: usr.email,
							token: usr.token,
							date_created: usr.date_created,
							full_name: usr.full_name,
							role: usr.role
						});
					}
				} else {
//					cb(new Error('Token does not match.'), null);
				}
			});
		} else {
			err = {error: 'Issue decoding incoming token.'};
			cb(err);
		}
	} else {
		var err = {error: 'Invalid or missing Token'};
		cb(err);
	}
}

Account.statics.login = function (username, password, cb) {

	if (username !== undefined && username !== '' && password !== undefined && password !== ''){
		this.findOne({email: username, password: password}, function(err, user){
			if (err){
				cb(err, null);
			} else if (user) {

				//TODO
				//Por ahora solo acceso a terminales
				var rutasAcceso = ['matches.search','tarifario', 'invoices', 'invoices.result', 'invoices.search', 'matches', 'control', 'cfacturas', 'cfacturas.result', 'gates', 'gates.invoices', 'gates.invoices.result', 'gates.result.container', 'turnos', 'turnos.result'];

				cb(false, {
					acceso: rutasAcceso,
					role: user.role,
					email: user.email,
					terminal: user.terminal,
					token: user.token,
					date_created: user.date_created,
					full_name: user.full_name
				});
			} else {
				var errMsg = 'Invalid or missing Login or Password';
				console.log(errMsg);
				cb({error: errMsg});
			}
		});
	} else {
		var errMsg = 'Invalid or missing Login or Password';
		console.log(errMsg);
		cb({error: errMsg});
	}

}

Account.statics.password = function (email, password, newPassword, cb) {
	if (email !== undefined && email !== '' && password !== undefined && password !== '' && newPassword !== undefined){
		this.update({email: email, password: password},{$set:{password: newPassword}}, null, function (err, user){
			if (err){
				cb(err, null);
			} else {
				cb(null, {data: "Password changed successfully"});
			}
		});
	} else {
		var errMsg = 'Invalid or missing Login or Password';
		console.log(errMsg);
		cb({error: errMsg});
	}
}

Account.statics.findUser = function(email, token, cb) {
    var self = this;
    this.findOne({email: email}, function(err, usr) {
        if(err || !usr) {
            cb(err, null);
        } else if (token === usr.token.token) {
            cb(false, {email: usr.email, token: usr.token, date_created: usr.date_created, full_name: usr.full_name});
        } else {
            cb(new Error('Token does not match.'), null);
        }
    });
};

Account.statics.findUserByEmailOnly = function(email, cb) {
    var self = this;
    this.findOne({email: email}, function(err, usr) {
        if(err || !usr) {
            cb(err, null);
        } else {
            cb(false, usr);
        }
    });
};

Account.statics.createUserToken = function(email, cb) {
    var self = this;
    this.findOne({email: email}, function(err, usr) {
        if(err || !usr) {
            console.log('err');
        }
        //Create a token and add to user and save
        var token = self.encode({email: email});
        usr.token = new TokenModel({token:token});
        usr.save(function(err, usr) {
            if (err) {
                cb(err, null);
            } else {
                console.log("about to cb with usr.token.token: " + usr.token.token);
                cb(false, usr.token.token);//token object, in turn, has a token property :)
            }
        });
    });
};

Account.statics.generateResetToken = function(email, cb) {
	console.log("in generateResetToken....");
	this.findUserByEmailOnly(email, function(err, user) {
		if (err) {
			cb(err, null);
		} else if (user) {
			//Generate reset token and URL link; also, create expiry for reset token
			user.reset_token = require('crypto').randomBytes(32).toString('hex');
			var now = new Date();
			var expires = new Date(now.getTime() + (config.resetTokenExpiresMinutes * 60 * 1000)).getTime();
			user.reset_token_expires_millis = expires;
			user.save();
			cb(false, user);
		} else {
			//TODO: This is not really robust and we should probably return an error code or something here
			cb(new Error('No user with that email found.'), null);
		}
	});
};

module.exports = mongoose.model('Account', Account);
