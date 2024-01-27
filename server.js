const express = require("express");
const config = require("./config.json");
const logger = require("./lib/logger.js")
const app = express();

const path = require("path");

const routes = require("./routes/index.js")

//Log all incoming HTTP requests
app.use((req, res, next) => {
  logger.http_log(req);
  next();
});

logger.log("[main]: Setting up static directories.")
app.use(express.static(path.join(__dirname, "/static_index")));
app.use("/static", express.static(path.join(__dirname, "/static")));

logger.log("[main]: Setting up routes.")
for (const route of routes) {
  app.use(route.path, route.route)
}

app.listen(config.http.port, () => {
  logger.log(`[main]: altnnas listening on ${config.http.port}`);
})
