/**
 * Created by diego on 24/07/17.
 */
"use strict";

var fs = require('fs');
var lazy = require('lazy');

var file = '/home/diego/Downloads/DatosISOActualizados.csv';

fs.exists(file, exists => {
    if (exists) {


        var stream = fs.createWriteStream("/home/diego/Downloads/my_file.sql");
        stream.once('open', fd => {

            var i = 0;
            lazy = require("lazy");
            new lazy(fs.createReadStream(file))
                .lines
                .forEach(line => {
                    if (line.toString().substr(0, 3) !== 'REQ') {
                        let linea = line.toString();
                        stream.write(`update invoice_detail set iso = '${linea.substr(12, 4)}' where contenedor = '${linea.substr(0, 11)}';\n`);
                        i++;
                    }
                }
            ).on('pipe', () => {
                    console.log(i)
                    stream.end();
                });
        });

    } else {
        process.exit();
    }
});
