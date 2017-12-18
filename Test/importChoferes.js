/**
 * Created by diego on 24/07/17.
 */
"use strict";

var fs = require("fs");
var lazy = require("lazy");

var mongoose = require("mongoose");

mongoose.connect("mongodb://10.1.0.60:27017/terapi");

var driver = require("../models/driver");

var file = "/home/diego/Downloads/Choferes.csv";

fs.exists(file, exists => {

    if (exists) {

        var stream = fs.createWriteStream("/home/diego/Downloads/insertMongoChoferes.txt");
        stream.once("open", fd => {

            var i = 0;
            lazy = require("lazy");
            new lazy(fs.createReadStream(file))
                .lines
                .forEach(line => {
                    let linea = line.toString();
                    driver.create({
                        _id: linea.toString().substr(64, 14).trim(),
                        lastname: linea.toString().substr(0, 29).trim(),
                        firstname: linea.toString().substr(29, 35).trim(),
                        mobile: linea.toString().substr(79, 300).trim()
                    });
                    // stream.write(`db.drivers.insert({
                    //     "_id": ${linea.toString().substr(64, 14).trim()}, 
                    //     "lastname": "${linea.toString().substr(0, 29).trim()}",
                    //     "firstname": "${linea.toString().substr(29, 35).trim()}",
                    //     "mobile": "${linea.toString().substr(79, 300).trim()}"});
                    //     \n`);
                    // stream.write(linea.toString().substr(0, 300)+'\n');
                    i++;
                }).on("pipe", () => {
                    console.log(i);
                    stream.end();
                });
        });

    } else {
        process.exit();
    }
});
