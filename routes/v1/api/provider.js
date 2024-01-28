const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const utils = require('utils');

const xmlbuilder = require("xmlbuilder");

const route = express.Router();

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

route.get("/service_token/@me", (req, res) => {
    const client_id = req.query['client_id'];

    res.send(xmlbuilder.create({
        service_token : {
            token : utils.generateServiceToken()
        }
    }).end({pretty : true, allowEmpty : true}))
})

module.exports = route