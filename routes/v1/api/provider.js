const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.use((req, res, next) => {
    if(auth.checkAuth(req, res)){
        next();
    }
});

route.get("/service_token/@me", (req, res) => {
    const client_id = req.query['client_id'];

    res.send(xmlbuilder.create({
        service_token : {
            token : "This_Is_A_Token_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!"
        }
    }).end({pretty : true, allowEmpty : true}))
})

module.exports = route