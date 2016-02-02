
/**
 * Created by diego on 1/4/16.
 */
var python = require('child_process').spawn(
    'python',
    // second argument is array of parameters, e.g.:
    ["/home/diego/NetBeansProjects/Python1/src/python.py"]
);
var output = "";
python.stdout.on('data', function(data){

    output += data ;
    console.log(output);
});
python.on('close', function(code){

    console.log(output);
});

