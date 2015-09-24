/**
 * Created by diego on 6/10/14.
 */

// Test Object
//var per = require('./testObjectObject');
//var persona = new per.person("Diego");
//var persona2 = new per.person("Lu");
//console.log(persona.getName());
//console.log(persona.getName());

console.time('f');

var os = require('os');
console.log(os.cpus());
console.log(os.platform());
console.log(os.type());
console.log(os.hostname());
console.log(os.release());
console.log(os.networkInterfaces());

var e = console.timeEnd('f');

/*
var container = require("./include/container.js");

// constructor call
var object = new container("MOFU0750056");
console.log(object);
console.log(object.number);
//console.log(object.check());
console.log(object.isValid);
*/