var mail = require("../include/emailjs");
var config = require("../config/config.js");

var options = {
    user:    "noreply",
    password: "desarrollo",
    host:    "10.10.0.170",
    port: "25",
    domain: "puertobuenosaires.gob.ar",
    ssl:     false,
    status: true,
    throughBcc: false
}

var emailConfig = Object.create(config.email);
console.log(config.email)
console.log(emailConfig);
mail = new mail.mail(emailConfig);

mail.send("reyesdiego@hotmail.com", "hola", "mensaje", function (err, meba) {
    console.error(err);
    console.log(meba);
})
return
