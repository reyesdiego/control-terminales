/**
 * Created by Administrator on 1/17/14.
 */
module.exports = {
    /**
     * Millis conversions cheat sheet:
     * 1 second: 1000
     * 1 minute: 60000
     * 10 minutes: 600000
     * 30 minutes: 1800000
     * 1 hour: 3600000
     * 12 hours: 43200000
     * 24 hours: 86400000
     * 1 week: 604800000
     */
    'ttl': 3600000, //1 hour
    'resetTokenExpiresMinutes': 20, //20 minutes later
    'url': "http://10.10.0.223:8080",
    'email': {
        user:    "noreply",
        password: "desarrollo",
        host:    "10.10.0.170",
        port: "25",
        domain: "puertobuenosaires.gov.ar",
        ssl:     false,
        status: true,
        throughBcc: true
    },
    'log': {
        path: 'log/',
        filename: 'nohup.out',
        toConsole: true,
        toFile: false
    },
    'mongo_url': 'mongodb://localhost:27017/terapi',
    'mongo_opts': {
        user: 'admin',
        pass: 'desarrollo',
        auth: {authdb: "admin"}
    },
    'mongo_url_log': 'mongodb://localhost:27017/logging',
    'mongo_opts_log': {
        user: 'admin',
        pass: 'desarrollo',
        auth: {authdb: "admin"}
    },
    'server_port': 8080,
    'server_ssl_port': 443,
    oracle: {
        hostname: "10.10.0.226",
        port: 1521,
        database: "orcl.orapruebadie.agp.gob.ar", // System ID (SID)
        user: "HR",
        password: "oracle_4U"
    }
};