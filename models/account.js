var mongoose = require('mongoose'),
    _ = require('underscore')._,
    Schema = mongoose.Schema,
    path = require('path'),
    config = require(path.join(__dirname, '..', '/config/config.js')),
    passportLocalMongoose = require('passport-local-mongoose'),
    crypto = require('crypto'),
    jwt = require('jwt-simple'),
    tokenSecret = 'put-a-$Ecr3t-h3re';

var Token = new Schema({
    token: {type: String},
    date_created: {type: Date, default: Date.now}
});

Token.methods.hasExpired = function () {
    'use strict';
    var now = new Date();
    return (now.getTime() - this.date_created.getTime()) > config.ttl;
};

var TokenModel = mongoose.model('Token', Token),
    Account = new Schema({
        email: { type: String, required: true, lowercase: true, index: { unique: true } },
        password: { type: String},
        terminal: {type: String, required: true, uppercase: true, enum: ['BACTSSA', 'TRP', 'TERMINAL4', 'AGP']},
        role: {type: String},
        user: {type: String},
        group: {type: String},
        full_name: {type: String, required: true},
        date_created: {type: Date, default: Date.now},
        token: {type: Object},
        //For reset we use a reset token with an expiry (which must be checked)
        reset_token: {type: String},
        reset_token_expires_millis: {type: Number},
        status: {type: Boolean},
        acceso: [{type: String}],
        lastLogin: {type: Date},
        emailToApp: [{type: String}]
    });

Account.plugin(passportLocalMongoose, {usernameField: 'email'});

Account.statics.encode = function (data) {
    'use strict';
    return jwt.encode(data, tokenSecret);
};

Account.statics.decode = function (data) {
    'use strict';
    return jwt.decode(data, tokenSecret);
};

Account.statics.verifyToken = function (incomingToken, cb) {
    'use strict';
    var err,
        decoded;

    if (incomingToken !== undefined && incomingToken !== null) {
        try {
            decoded = jwt.decode(incomingToken, tokenSecret);
        } catch (e) {
            err = {code: "AGP-0015", message: 'Error al decodificar el Token.' + e.message};
            return cb(err);
        }
        //Now do a lookup on that email in mongodb ... if exists it's a real user
        if (decoded && decoded.email) {
            this.findOne({email: decoded.email}, function (err, usr) {
                if (err) {
                    err = {message: 'Issue finding user.', data: err};
                    return cb(err);
                } else if (!usr) {
                    err = {message: 'El Usuario no existe.'};
                    return cb(err);
                } else if (incomingToken === usr.token.token) {
                    if (cb !== undefined) {
                        return cb(false, {
                            terminal: usr.terminal,
                            email: usr.email,
                            user: usr.user,
                            group: usr.group,
                            token: usr.token,
                            date_created: usr.date_created,
                            full_name: usr.full_name,
                            role: usr.role
                        });
                    }
                }// else {
//                    cb(new Error('Token does not match.'), null);
//                }
            });
        } else {
            err = {code: "AGP-0014", message: 'El Token es vacio o invalido'};
            return cb(err);
        }
    } else {
        err = {code: "AGP-0014", message: 'El Token es vacio o invalido'};
        return cb(err);
    }
};

Account.statics.login = function (username, password, cb) {
    'use strict';
    var errMsg = '',
        user;
    if (username !== undefined && username !== '' && password !== undefined && password !== '') {
        this.findOne({
            $or: [{email: username}, {user: username}],
            password: password
        }, function (err, user) {
            if (err) {
                return cb(err, null);
            } else if (user) {

                user = {
                    _id : user._id,
                    acceso: user.acceso,
                    role: user.role,
                    email: user.email,
                    user: user.user,
                    group: user.group,
                    terminal: user.terminal,
                    token: user.token,
                    date_created: user.date_created,
                    full_name: user.full_name,
                    emailToApp: user.emailToApp,
                    status: user.status,
                    salt: user.salt
                };
                if (user.token !== undefined) {
                    return cb(false, user);
                } else {
                    errMsg = 'El usuario no ha validado su cuenta para ingresar el sistema. Verifique su cuenta de correo.';
                    return cb({code: "ACC-0003", message: errMsg, data: user});
                }
            } else {
                errMsg = 'Usuario o Contraseña incorrectos';
                return cb({code: "ACC-0001", message: errMsg});
            }
        });
    } else {
        errMsg = 'Usuario o Contraseña no pueden ser vacios';
        return cb({code: "ACC-0002", message: errMsg});
    }
};

Account.statics.password = function (email, password, newPassword, cb) {
    'use strict';
    if (email !== undefined && email !== '' && password !== undefined && password !== '' && newPassword !== undefined) {
        this.update({
            $or: [{email: email}, {user: email}],
            password: password
        },
            {
                $set: { password: newPassword }
            },
            null,
            function (err, rowsAffected, user) {
                if (err) {
                    return cb(err, null);
                } else {
                    if (rowsAffected === 1) {
                        return cb(null, "El cambio de Contraseña ha sido exitoso.");
                    } else {
                        return cb({message: "Usuario o Contraseña incorrectos."});
                    }
                }
            }
            );
    } else {
        var errMsg = 'Usuario o Contraseña incorrectos.';
        console.log(errMsg);
        return cb({error: errMsg});
    }
};

Account.statics.findUser = function (email, token, cb) {
    'use strict';
    var self = this;
    self.findOne({$or: [{email: email}, {user: email}]}, function (err, usr) {
        if (err || !usr) {
            return cb(err, null);
        } else if (token === usr.token.token) {
            return cb(false, {email: usr.email, user: usr.user, token: usr.token, date_created: usr.date_created, full_name: usr.full_name});
        } else {
            return cb(new Error('Token does not match.'), null);
        }
    });
};

Account.statics.findAll = function (param, project, cb) {
    'use strict';
    var self = this,
        projectAux = {},
        result;

    if (typeof project === 'function') {
        cb = project;
    } else {
        projectAux = project;
    }

    result = this.find(param, projectAux);
    result.exec(function (err, data) {
        if (!err) {
            if (typeof cb === 'function') {
                return cb(err, data);
            }
        }
    });
};

Account.statics.findUserByEmailOnly = function (email, cb) {
    'use strict';
    var self = this;

    this.findOne({email: email}, function(err, usr) {
        if (err) {
            return cb(err, null);
        } else {
            return cb(null, usr);
        }
    });
};

Account.statics.createUserToken = function (email, cb) {
    'use strict';
    var self = this;
    this.findOne({email: email}, function (err, usr) {
        if (err || !usr) {
            console.log('err');
        }
        //Create a token and add to user and save
        var token = self.encode({email: email});
        usr.token = new TokenModel({token: token});
        usr.save(function (err, usr) {
            if (err) {
                return cb(err, null);
            } else {
                console.log("about to cb with usr.token.token: " + usr.token.token);
                return cb(false, usr.token.token);//token object, in turn, has a token property :)
            }
        });
    });
};

Account.statics.generateResetToken = function (email, cb) {
    'use strict';
    console.log("in generateResetToken....");
    this.findUserByEmailOnly(email, function(err, user) {
        if (err) {
            return cb(err, null);
        } else if (user) {
            //Generate reset token and URL link; also, create expiry for reset token
            user.reset_token = require('crypto').randomBytes(32).toString('hex');
            var now = new Date(),
                expires = new Date(now.getTime() + (config.resetTokenExpiresMinutes * 60 * 1000)).getTime();
            user.reset_token_expires_millis = expires;
            user.save();
            if (typeof cb  === 'function') {
                return cb(false, user);
            }
        } else {
            if (typeof cb  === 'function') {
                return cb(new Error('No user with that email found.'), null);
            }
        }
    });
};

function getEmailToAppList(self, param, cb) {
    'use strict';
    var result = [],
        accounts = self.find(param, {_id: 0, email: 1});
    accounts.exec(function (err, data) {
        if (err) {
            if (typeof cb  === 'function') {
                return cb(err);
            }
        } else {
            for (var i = 0, len = data.length; i < len; i++) {
                result.push(data[i].email);
            }
            if (typeof cb  === 'function') {
                return cb(null, {status: 'OK' , data: result});
            }
        }
    });
}

Account.statics.findEmailToApp = function (app, cb) {
    'use strict';
    getEmailToAppList(this, {emailToApp: app}, function (err, data) {
        cb(err, data);
    });
};

Account.statics.findEmailToAppByUser = function (user, app, cb) {
    'use strict';
    getEmailToAppList(this, {user: user, emailToApp: app}, function (err, data) {
        cb(err, data);
    });
};

module.exports = mongoose.model('accounts', Account);