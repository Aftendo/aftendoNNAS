const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
var validator = require("email-validator");
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.use((req, res, next) => {
    if(auth.checkAuth(req, res)){
        next();
    }
});

route.post("/validate/email", (req, res) => {
    const email = req.body['email'];
    logger.log(`[support]: email validator got: ${email}`);
    // TODO: validate email in db
    if(validator.validate(email)){
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
})

module.exports = route