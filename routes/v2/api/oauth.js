const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const route = express.Router();
const utils = require("utils")
const config = require("../../../config.json")
const bodyParser = require("body-parser")

route.use(bodyParser.json());

route.use((req, res, next) => {
    auth.checkAuthApi(req, res, next);
});

route.post("/decrypt", async (req, res) => {
    const service_token = req.body.service_token.replace(" ", "+")
    console.log(service_token)
    if (!service_token) { res.status(400).send({success: 0, error: "Sorry, no service_token was provided. Please try again."}) }

    res.send(await utils.generateServiceTokenString(service_token));
})


module.exports = route;