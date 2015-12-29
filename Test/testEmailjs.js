var mail = require("../include/emailjs");
var config = require("../config/config.js");
var fs = require('fs');

//var privateKey = fs.readFileSync('exchange_new.pfx' );

var options = {
    user:    "noreply",
    password: "desarrollo",
    host:    "10.10.0.176",
    port: "587",
//    domain: "puertobuenosaires.gob.ar",
    domain: "agp",
    from: "Administración General de Puertos <noreply@puertobuenosaires.gob.ar>",
    ssl: false,
    status: true,
    throughBcc: false
}


//var emailConfig = Object.create(config.email);
//var emailConfig = Object.create(options);
//console.log(config.email)
console.log(options);
mail = new mail.mail(options);

mail.send("reyesdiego@hotmail.com", "hola", "mensaje", function (err, meba) {
//    mail.send("reyesdiego@hotmail.com", "hola", "mensaje", function (err, meba) {
    if (err) {
        console.error(err);
    } else {
        console.log(meba);
    }
    process.exit();
});
