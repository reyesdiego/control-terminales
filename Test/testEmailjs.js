var mail = require("../include/emailjs");
var config = require("../config/config.js");

var options = {
    user:    "noreply",
    password: "desarrollo",
    host:    "10.10.0.170",
    port: "25",
    domain: "puertobuenosaires.gob.ar",
    from: "Administración General de Puertos <noreply@puertobuenosaires.gob.ar>",
    ssl:     false,
    status: true,
    throughBcc: false
}

//var emailConfig = Object.create(config.email);
//var emailConfig = Object.create(options);
//console.log(config.email)
console.log(options);
mail = new mail.mail(options);

mail.send("dreyes@puertobuenosaires.gob.ar", "hola", "mensaje", function (err, meba) {
    if (err) {
        console.error(err);
    } else {
        console.log(meba);
    }
    process.exit();
});
