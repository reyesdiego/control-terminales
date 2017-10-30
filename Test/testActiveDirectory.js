if (req.socket.remoteAddress !== '127.0.0.1' && req.socket.remoteAddress !== 'localhost'){
    var ActiveDirectory = require('activedirectory');
    var ad = new ActiveDirectory({url: 'ldap://10.0.0.56:389',
                                        baseDN: 'dc=ptobaires,dc=gov,dc=ar'
                                    });
    var user = util.format('%s@ptobaires.gov.ar', json.email);
    ad.authenticate(user, json.password, function(err, auth) {

        if (auth) {
            Account.findOne({user:"agp"}, function (err, userAgp){
                var msg = util.format("%s - User '%s' has logged in From: %s", dateTime.getDatetime(), json.email, req.socket.remoteAddress);
                console.log(msg);

                //Por ahora solo acceso a terminales
                var rutasAcceso = ['matches.search','tarifario', 'invoices', 'invoices.result', 'invoices.search', 'matches', 'control', 'cfacturas', 'cfacturas.result', 'gates', 'gates.invoices', 'gates.invoices.result', 'gates.result.container', 'turnos', 'turnos.result'];

                var result = {
                    acceso: rutasAcceso,
                    role: userAgp.role,
                    email: json.email,
                    user: json.email,
                    terminal: userAgp.terminal,
                    token: userAgp.token,
                    date_created: userAgp.date_created,
                    full_name: userAgp.full_name
                };
                res.send(200, result);
            });
        }
        else {
            if (err) {
                var errMsg = util.format("%s - ERROR: Authentication Failed -  %s. From: %s", dateTime.getDatetime(), JSON.stringify(err), req.socket.remoteAddress);
                console.error(errMsg);
                res.send(403, errMsg);
                return;
            }
            var errMsg = util.format("%s - ERROR: Authentication Failed - %s. From: %s", dateTime.getDatetime(), err.error, req.socket.remoteAddress);
            console.error(errMsg);
            res.send(403, errMsg);
        }
    });
} else {
    var errMsg = util.format("%s - ERROR: Authentication Failed - %s. From: %s", dateTime.getDatetime(), err.error, req.socket.remoteAddress);
    console.error(errMsg);
    res.send(403, errMsg);
}