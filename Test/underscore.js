/**
 * Created by diego on 2/10/16.
 */
var _ =  require("underscore");


var objOri = {
    campo1: 1,
    campo2: "DOS",
    sub: {
        sub1: 1
    }
};

console.log(objOri);

console.log(cambio(objOri));

console.log(objOri);



function cambio(obj) {
//    var cloned = _.clone(obj);

    var cloned = JSON.parse(JSON.stringify(obj));

    cloned.campo1 = 2;
    cloned.sub.sub1 = 2;
    cloned.campo2 = "TRES";
    cloned.sub.sub1 = "DES";

    return cloned;
}