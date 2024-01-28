const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const validator = require("email-validator");
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

route.post("/validate/email", (req, res) => {
    const email = req.body.email;
    logger.log(`[support]: email validator got: ${email}`);
    // TODO: validate email in db
    if(validator.validate(email) && !email.includes("@wii.com")){ // official server checked for it, so why don't we.
        res.sendStatus(200);
    } else {
        res.status(401).send(nn_error.createError("0103", "Email format is invalid"));
    }
})

// Parental controls routes
route.get("/send_confirmation/pin/:email", (req, res) => {
    // Do this later? We need a mailer for this. TurboSMTP might be good. Who knows!
    res.sendStatus(200);
});

module.exports = route