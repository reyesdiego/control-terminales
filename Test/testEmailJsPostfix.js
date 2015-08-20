/**
 * Created by diego on 7/29/15.
 */

var mail = require("../include/emailjs");

var options = {
    user:    "/var/vmail/vhosts/puertobuenosaires.gov.ar/noreply",
    //user:    "root",
    //password: "agpapi",
    host:    "10.1.0.61",
    port: "25",
    //domain: "puertobuenosaires.gov.ar",
    from: "Administración General de Puertos <noreply@puertobuenosaires.gov.ar>",
    ssl:     false,
    status: true,
    throughBcc: false
}

mail = new mail.mail(options);

var to = "reyesdiego@hotmail.com";
to = "dreyes@puertobuenosaires.gob.ar";
mail.send(to, "Probando" + Date.now(), "Probando", function (err, meba) {
    console.error(err);
    console.log(meba);
    process.exit();
})

