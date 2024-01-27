const express = require("express");
const config = require("./config.json");
const logger = require("./lib/logger.js")
const app = express();

const path = require("path");

const routes = require("./routes/index.js")

//Database
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  }
});


//Log all incoming HTTP requests
app.use((req, res, next) => {
  logger.http_log(req);
  next();
});

//Turns all XML request data into a readabl;e

logger.log("[main]: Creating static directories.")
app.use(express.static(path.join(__dirname, "/static_index")));
app.use("/static", express.static(path.join(__dirname, "/static")));

//Creating all rourt
logger.log("[main]: Creating all routes.")
for (const route of routes) {
  app.use(route.path, route.route)
}

app.listen(config.http.port, () => {
  logger.log(`[main]: altnnas listening on ${config.http.port}`);
})
