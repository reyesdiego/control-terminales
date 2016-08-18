/**
 * Created by diego on 17/08/16.
 */
'use strict';

var email = require('./testModuleEmailBalanza.js');

email(2)
.then(data=>{
        console.log(data);
    })
.catch(err => {
        console.log(err);
    });