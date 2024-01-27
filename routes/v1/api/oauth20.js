const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.post("/access_token/generate", (req, res) => {
    res.send(xmlbuilder.create({OAuth20 : {
        access_token : {
            token : "Hello_World",
            refresh_token : "Test",
            expires_in : 3600
        }
    }}).end({pretty : true, allowEmpty : true}))
})

module.exports = route