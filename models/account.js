"use strict";

var mongoose = require("mongoose"),
    _ = require("underscore")._,
    Schema = mongoose.Schema,
    path = require("path"),
    config = require(path.join(__dirname, "..", "/config/config.js")),
    passportLocalMongoose = require("passport-local-mongoose"),
    crypto = require("crypto"),
    jwt = require("jwt-simple");

const jwttoken = require("jsonwebtoken");
const tokenSecret = "put-a-$Ecr3t-h3re";

var Token = new Schema({
    token: { type: String },
    date_created: { type: Date, default: Date.now }
});

Token.methods.hasExpired = function () {
    var now = new Date();
    return (now.getTime() - this.date_created.getTime()) > config.ttl;
};

var TokenModel = mongoose.model("Token", Token),
    Account = new Schema({
        email: { type: String, required: true, lowercase: true, index: { unique: true } },
        password: { type: String },
        terminal: { type: String, required: true, uppercase: true, enum: ["BACTSSA", "TRP", "TERMINAL4", "AGP"] },
        role: { type: String },
        user: { type: String },
        group: { type: String },
        full_name: { type: String, required: true },
        date_created: { type: Date, default: Date.now },
        token: { type: Object },
        //For reset we use a reset token with an expiry (which must be checked)
        reset_token: { type: String },
        reset_token_expires_millis: { type: Number },
        status: { type: Boolean },
        acceso: [{ type: String }],
        lastLogin: { type: Date },
        emailToApp: { type: Object }
    });

Account.plugin(passportLocalMongoose, { usernameField: "email" });

Account.statics.encode = function (data) {
    return jwt.encode(data, tokenSecret);
};

Account.statics.decode = function (data) {
    return jwt.decode(data, tokenSecret);
};

Account.statics.createToken = function (payload, options = { expiresIn: 30 }) {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, tokenSecret, { expiresIn: options.expiresIn }, (token) => {
            resolve(token);
        });
    });
};

Account.statics.verifyToken = function (incomingToken, cb) {
    var err,
        decoded;

    if (incomingToken !== undefined && incomingToken !== null) {
        try {
            decoded = jwt.decode(incomingToken, tokenSecret);
        } catch (e) {
            err = { code: "AGP-0015", message: "Error al decodificar el Token." + e.message };
            return cb(err);
        }

        //Now do a lookup on that email in mongodb ... if exists it's a real user
        if (decoded && decoded.email) {
            this.findOne({ email: decoded.email }, (err, usr) => {
                if (err) {
                    err = { message: "Issue finding user.", data: err };
                    return cb(err);
                } else if (!usr) {
                    err = { message: "El Usuario no existe." };
                    return cb(err);
                } else if (incomingToken === usr.token.token) {
                    if (cb !== undefined) {
                        return cb(false, {
                            _id: usr._id,
                            terminal: usr.terminal,
                            email: usr.email,
                            user: usr.user,
                            group: usr.group,
                            token: usr.token,
                            date_created: usr.date_created,
                            full_name: usr.full_name,
                            role: usr.role,
                            emailToApp: usr.emailToApp || []
                        });
                    }
                } else {
                    cb({ code: "AGP-0014", message: "El Token es vacio o invalido" }, null);
                }
            });
        } else {
            err = { code: "AGP-0014", message: "El Token es vacio o invalido" };
            return cb(err);
        }
    } else {
        err = { code: "AGP-0014", message: "El Token es vacio o invalido" };
        return cb(err);
    }
};

Account.statics.verifyTokenZap = function (incomingToken, cb) {
    var err,
        decoded;

    if (incomingToken !== undefined && incomingToken !== null) {

        jwttoken.verify(incomingToken, tokenSecret, (err, tokenData) => {
            if (err) {
                err = { code: "AGP-0016", message: `El Token ha expirado ${err.expiredAt}` };
                return cb(err);
            } else {
                //Now do a lookup on that email in mongodb ... if exists it's a real user
                if (tokenData && tokenData.email) {
                    this.findOne({ email: tokenData.email }, (err, usr) => {
                        if (err) {
                            err = { message: "Issue finding user.", data: err };
                            return cb(err);
                        } else if (!usr) {
                            err = { message: "El Usuario no existe." };
                            return cb(err);
                        } else {
                            if (cb !== undefined) {
                                return cb(false, {
                                    _id: usr._id,
                                    terminal: usr.terminal,
                                    email: usr.email,
                                    user: usr.user,
                                    group: usr.group,
                                    token: usr.token,
                                    date_created: usr.date_created,
                                    full_name: usr.full_name,
                                    role: usr.role,
                                    emailToApp: usr.emailToApp || []
                                });
                            }
                        }
                    });
                } else {
                    err = { code: "AGP-0014", message: "El Token es vacio o invalido" };
                    return cb(err);
                }
            }
        });

    } else {
        err = { code: "AGP-0014", message: "El Token es vacio o invalido" };
        return cb(err);
    }
};

Account.statics.login = function (username, password, cb) {
    var errMsg = "",
        user;
    if (username !== undefined && username !== "" && password !== undefined && password !== "") {
        this.findOne({
            $or: [{ email: username }, { user: username }],
            password: password
        },
        (err, account) => {
            let user = {
                _id: account._id,
                acceso: account.acceso,
                role: account.role,
                email: account.email,
                user: account.user,
                group: account.group,
                terminal: account.terminal,
                date_created: account.date_created,
                full_name: account.full_name,
                emailToApp: account.emailToApp,
                status: account.status,
                salt: account.salt,
                token: ""
            };
            if (err) {
                return cb(err, null);
            } else if (user && user.terminal !== "ZAP") {

                user.token = account.token;

                if (user.token !== undefined) {
                    return cb(false, user);
                } else {
                    errMsg = "El usuario no ha validado su cuenta para ingresar el sistema. Verifique su cuenta de correo.";
                    return cb({ code: "ACC-0003", message: errMsg, data: user });
                }
            } if (user.terminal === "ZAP") {
                jwttoken.sign({ email: account.email, password: password }, tokenSecret, { expiresIn: "1 day" }, (token) => {
                    user.token = token;
                    return cb(false, user);
                });
            } else {
                errMsg = "Usuario o Contraseña incorrectos";
                return cb({ code: "ACC-0001", message: errMsg });
            }
        });
    } else {
        errMsg = "Usuario y/o Contraseña no pueden ser vacios";
        return cb({ code: "ACC-0002", message: errMsg });
    }
};

Account.statics.password = function (email, password, newPassword, cb) {
    if (email !== undefined && email !== "" && password !== undefined && password !== "" && newPassword !== undefined) {
        this.update({
            $or: [{ email: email }, { user: email }],
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
                        return cb({ message: "Usuario o Contraseña incorrectos." });
                    }
                }
            });
    } else {
        var errMsg = "Usuario o Contraseña incorrectos.";
        console.log(errMsg);
        return cb({ error: errMsg });
    }
};

Account.statics.findUser = function (email, token, cb) {
    var self = this;
    self.findOne({ $or: [{ email: email }, { user: email }] }, function (err, usr) {
        if (err || !usr) {
            return cb(err, null);
        } else if (token === usr.token.token) {
            return cb(false, { email: usr.email, user: usr.user, token: usr.token, date_created: usr.date_created, full_name: usr.full_name });
        } else {
            return cb(new Error("Token does not match."), null);
        }
    });
};

Account.statics.findAll = function (param, project, cb) {
    var self = this,
        projectAux = {},
        result;

    if (typeof project === "function") {
        cb = project;
    } else {
        projectAux = project;
    }

    result = this.find(param, projectAux);
    result.exec(function (err, data) {
        if (!err) {
            if (typeof cb === "function") {
                return cb(err, data);
            }
        }
    });
};

Account.statics.findUserByEmailOnly = function (email, cb) {
    var self = this;

    this.findOne({ email: email }, function (err, usr) {
        if (err) {
            return cb(err, null);
        } else {
            return cb(null, usr);
        }
    });
};

Account.statics.createUserToken = function (email, cb) {
    var self = this;
    this.findOne({ email: email }, function (err, usr) {
        if (err || !usr) {
            console.log("err");
        }
        //Create a token and add to user and save
        var token = self.encode({ email: email });
        usr.token = new TokenModel({ token: token });
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
    console.log("in generateResetToken....");
    this.findUserByEmailOnly(email, function (err, user) {
        if (err) {
            return cb(err, null);
        } else if (user) {
            //Generate reset token and URL link; also, create expiry for reset token
            user.reset_token = require("crypto").randomBytes(32).toString("hex");
            var now = new Date(),
                expires = new Date(now.getTime() + (config.resetTokenExpiresMinutes * 60 * 1000)).getTime();
            user.reset_token_expires_millis = expires;
            user.save();
            if (typeof cb === "function") {
                return cb(false, user);
            }
        } else {
            if (typeof cb === "function") {
                return cb(new Error("No user with that email found."), null);
            }
        }
    });
};

Account.statics.findEmailToApp = function (nameApp) {
    return new Promise((resolve, reject) => {
        var result = [];

        var param = JSON.parse(`{"emailToApp.${nameApp}": true}`);

        this.find(param, { _id: 0, email: 1 })
            .exec((err, data) => {
                if (err) {
                    reject(err);
                } else {
                    result = data.map(item => ((item.email)));
                    //for (var i = 0, len = data.length; i < len; i++) {
                    //    result.push(data[i].email);
                    //}
                    resolve({ status: "OK", data: result });
                }
            });
    });
};
/*
Account.statics.findEmailToAppByUser = function (user, app, cb) {
    'use strict';
    getEmailToAppList(this, {user: user, emailToApp: app}, function (err, data) {
        cb(err, data);
    });
};
*/
module.exports = mongoose.model("accounts", Account);