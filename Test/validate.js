/**
 * Created by diego on 18/04/17.
 */
"use strict";

var validate = require("validate.js");

var constraints = {
    username: {
        presence: {message: "es requerido."},
        exclusion: {
            within: ["nicklas"],
            message: "'%{value}' is not allowed"
        }
    },
    password: {
        presence: true,
        length: {
            minimum: 6,
            message: "must be at least 6 characters"
        }
    }
};

console.log(validate({username: "", password: "bad"}, constraints));
// => {
//   "username": ["Username can't be blank"],
//   "password": ["Password must be at least 6 characters"]
// }
console.log('___________________________');
console.log(validate({username: "nick", password: "better"}, constraints));
// => undefined
console.log('___________________________');

console.log(validate({username: "nicklas", password: "better"}, constraints));
// => {"username": ["Username 'nicklas' is not allowed"]}
console.log('___________________________');


