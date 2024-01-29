const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
var validator = require("email-validator");
const route = express.Router();

route.get("/", (req, res) => {
    logger.log(`[webui]: Index`);
    res.send("AltNNAS WebUI");
})

route.all("/*", (req, res) => {
    res.status(404).send("Not found");
});

module.exports = route