require("./aliases")();
const express = require("express");
const config = require("./config.json");
const logger = require("logger")
const app = express();

const path = require("path");

const routes = require("./routes/index.js");

const bodyParser = require('body-parser');
const nn_error = require("nn_error");
require('body-parser-xml')(bodyParser);

logger.log("[main]: Connecting to DB...");
//Database
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.pass,
    database: config.db.name
  }
});

try {
  knex.raw('select 1+1 as result').then(function () {
    logger.log("[main]: Connected!");
  });
} catch(e) {
  throw "Failed to connect to database.";
}

//Log all incoming HTTP requests
app.use((req, res, next) => {
  logger.http_log(req);
  next();
});

//Turns all XML request data into a readable JSON file
app.use(bodyParser.xml())

logger.log("[main]: Creating static directories.")
app.use(express.static(path.join(__dirname, "/static_index")));
app.use("/static", express.static(path.join(__dirname, "/static")));

//Creating all routes
logger.log("[main]: Creating all routes.")
for (const route of routes) {
  app.use(route.path, route.route)
}

app.use("/*", (req, res) => {
  if(config.env.debug){
    logger.warn(`Unknown route!`);
  }
  res.setHeader("Content-Type", "application/xml");
  res.status(404).send(nn_error.createError("0008", "Not found"));
})

app.listen(config.http.port, () => {
  logger.log(`[main]: altnnas listening on ${config.http.port}`);
})
