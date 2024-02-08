const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const knex = require('db');
const utils = require("utils");
const validator = require("email-validator");
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

route.post("/validate/email", async (req, res) => {
    const email = req.body.email;
    logger.log(`[support]: email validator got: ${email}`);
    // TODO: validate email in db
    if (validator.validate(email)) {
        if (email.includes("@wii.com") && email.includes("@nintendo.net") && email.includes("@nintendo.com") && email.includes("@rverse.club")){
            var rows = await knex.select('*').from('whitelist').where({'serial': req.headers["x-nintendo-serial-number"], 'type': 'email'});
            if (rows.length != 0) {
                res.send();
            } else {
                res.status(401).send(nn_error.createError("0103", "Email format is invalid"));
            }
        } else {
            res.send();
        }
    } else {
        res.status(401).send(nn_error.createError("0103", "Email format is invalid"));
    }
})

route.get("/resend_confirmation/", (req, res) => {
    res.send(xmlbuilder.create({ email: {} }).end({ pretty: false, allowEmpty: false }));
})

route.put("/email_confirmation/:pid/:code", async (req, res) => {
    if(req.params.code == "727420"){
        try {
            await knex('emails').where('pid', req.params.pid).update({'validated': 'Y', 'validated_date': knex.fn.now()});
            res.send(xmlbuilder.create({ email: {} }).end({ pretty: false, allowEmpty: false }));
        } catch(e) {
            console.log(e);
            res.status(500).send(utils.generateServerError());
        }
    } else {
        res.status(400).send(nn_error.createError('0116', "Missing or invalid verification code"));
    }
    
})

route.get("/forgotten_password/:pid", (req, res) => {
    res.send(xmlbuilder.create({ email: {} }).end({ pretty: false, allowEmpty: false }));
})

// Parental controls routes
route.get("/send_confirmation/pin/:email", (req, res) => {
    // Do this later? We need a mailer for this. TurboSMTP might be good. Who knows!
    res.sendStatus(200);
});

module.exports = route