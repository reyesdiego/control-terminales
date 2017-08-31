/**
 * Created by diego on 24/07/17.
 */
"use strict";

var moment = require("moment");
var fs = require('fs');
var lazy = require('lazy');

var file = '/home/diego/Desarrollo/AGP/Test/camionesAUSA.csv';

fs.exists(file, exists => {
    if (exists) {

        var stream = fs.createWriteStream("/home/diego/Downloads/camiones.sql");
        stream.once('open', fd => {

            var i = 0;
            lazy = require("lazy");
            new lazy(fs.createReadStream(file))
                .lines
                .forEach(line => {
                    var linea = line.toString().trim();

                    let tab = linea.indexOf('\t');
                    let patente = linea.slice(0, tab);

                    let tab1 = linea.indexOf('\t', tab + 1);
                    let gates;
                    if (tab1 === -1) {
                        gates = linea.substr(tab, linea.length).trim();
                        stream.write(`insert into camiones (patente, gates) values ('${patente}', ${gates});\n`);
                    } else {
                        gates = linea.substr(tab, tab1 - tab).trim();
                        let tab2 = linea.indexOf('\t', tab1 + 1);
                        let fecha1 = linea.substr(tab1, tab2 - tab1);
                        fecha1 = (moment(fecha1).isValid()) ? `to_date('${fecha1.trim()}', 'MM-DD-YY')` : 'null';
                        let tab3 = linea.indexOf('\t', tab2 + 1);
                        let fecha2 = linea.substr(tab2, tab3 - tab2);
                        fecha2 = (moment(fecha2).isValid()) ? `to_date('${fecha2.trim()}', 'MM-DD-YY')` : 'null';

                        stream.write(`insert into camiones (patente, gates, fecha_desde, fecha_hasta) values ('${patente}', ${gates}, ${fecha1}, ${fecha2});\n`);
                    }


                    i++;
                }
            ).on('pipe', () => {
                    console.log(i);
                    stream.end();
                });
        });

    } else {
        process.exit();
    }
});
