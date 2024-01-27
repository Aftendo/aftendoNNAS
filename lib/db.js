const config = require("../config.json");
const logger = require("logger");
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

module.exports = knex