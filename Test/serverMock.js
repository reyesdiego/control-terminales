// Express configuracion BEGIN
var express = require("express"),
    app = express();
var fs = require("fs");

//var favicon = require('serve-favicon');
var logger = require("morgan"),
    methodOverride = require("method-override"),
    //var session = require('express-session');
    bodyParser = require("body-parser"),
    multer = require("multer"),
    errorHandler = require("errorhandler");
// Express configuracion END

var http = require("http"),
    path = require("path");

var config = require("../config/config.js");

http.globalAgent.maxSockets = 100;
var server = http.createServer(app);

app.set("runtime", new Date());
app.set("port", process.env.PORT || 8080);
app.set("views", __dirname + "/public");
app.set("view engine", "jade");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, "public")));

app.all("/*", function (req, res, next) {
    "use strict";
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, token");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    //res.header('Access-Control-Request-Method', 'GET');
    res.header("Access-Control-Request-Headers", "Content-Type, token");
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    if ("OPTIONS" === req.method) {
        res.status(200).send();
    } else {
        next();
    }
    //next();
});

server.listen(app.get("port"), function () {
    "use strict";
    console.info("Nodejs server Version: %s", process.version);
    console.info("Running on %s://localhost:%s", "http", app.get("port"));
    console.info("Process Id (pid): %s", process.pid);
});


// If the Node process ends, close the Mongoose connection
process.on("SIGINT", function () {
    "use strict";
});

process.on("uncaughtException", function (err) {
    "use strict";
    console.info("Caught exception: " + err);
});


app.locals.moment = require("moment");

app.get("/", function (req, res) {
    res.status(200).send("HI: " + process.version + "\r\n");
});
app.get("/accounts", function (req, res) {
    res.status(200).send({ terminal: "BACTSSA", user: "bactssa" });
});

app.get("/csv", (req, res, next) => {

    res.status(200).header("Content-Type", "text/csv");
    //	const newUUID = uuid.v1();
    const newUUID = "pepe";

    let ws = fs.createWriteStream(`${__dirname}/${newUUID}.csv`);

    ws.on("finish", () => {
        res.download(`${__dirname}/${newUUID}.csv`);
    });

    //csv file built here 
    for (var i=0; i<1000001; i++) {
        ws.write("huge stuff easily 50k rows and 10 mb file");
    }
    ws.end();
});