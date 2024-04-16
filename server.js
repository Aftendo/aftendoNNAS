require("./aliases")();
const express = require("express");
const config = require("./config.json");
const logger = require("logger")
const knex = require("db");
const utils = require("utils");
const app = express();

const path = require("path");

const routes = require("./routes/index.js");

const bodyParser = require('body-parser');
const nn_error = require("nn_error");
require('body-parser-xml')(bodyParser);


function logHeaders(req, res, next) {
  const _setHeader = res.setHeader;
  res.setHeader = function(name, value) {
      console.log(`Header set: ${name}: ${value}`);
      _setHeader.call(this, name, value);
  };
  next();
}

logger.log("[main]: Connecting to DB...");
//Database
try {
  knex.raw('select 1+1 as result').then(function () {
    logger.log("[main]: Connected!");
  });
} catch(e) {
  throw `Failed to connect to database.\n${e}`;
}

//Log all incoming HTTP requests
if(config.env.logLevel > 0){
  app.use((req, res, next) => {
    logger.http_log(req);
    next();
  });
}

if(config.env.debug && config.env.logLevel > 1){
  app.use(logHeaders);
}

//app.set('static buffer size', 1024);

//Turns all XML request data into a readable JSON file
app.use(bodyParser.xml())

app.use(bodyParser.urlencoded({ extended: false }));

logger.log("[main]: Creating static directories.")
app.use(express.static(path.join(__dirname, "/static_index")));
app.use("/static", express.static(path.join(__dirname, "/static")));

//Creating all routes
logger.log("[main]: Creating all routes.")
for (const route of routes) {
  app.use(route.path, route.route)
}

app.get("/", (req, res) => {
  res.setHeader("Location", "/webui");
  res.sendStatus(302);
  // I AM SUCH A REBEL. (I didn't use res.redirect())
});

app.use("/*", (req, res) => {
  if(config.env.debug){
    logger.warn(`Unknown route!`);
  }
  res.setHeader("Content-Type", "application/xml");
  res.status(404).send(utils.generateNotFound());
})

app.listen(config.http.port, async () => {
  logger.log(`[main]: AltNNAS listening on ${config.http.port}`);
})
