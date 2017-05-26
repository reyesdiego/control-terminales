"use strict";

var mail = require("../include/emailjs");

var options = {
    user:    "",
    password: "",
    host:    "10.10.0.176",
    port: "25",
//    domain: "puertobuenosaires.gob.ar",
    domain: "",
    from: "Administración General de Puertos <noreply@puertobuenosaires.gob.ar>",
//    from: "Diego <dreyes@puertobuenosaires.gob.ar>",
    ssl: false,
    status: true,
    throughBcc: false
};


mail = new mail.mail(options);

mail.send("reyesdiego@hotmail.com", "hola 5", "mensaje", function (err, meba) {

    if (err) {
        console.error(err);
    } else {
        console.log(meba);
    }
    process.exit();
});
