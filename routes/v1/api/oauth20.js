const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

/*
    Generates an access token for NEX? Not sure what this really is for.
    Handles logging in though.
    Content-Type: XML

    For invalid password, return nn_error.createError("0106", "Invalid account ID or password"); with a 400 status
    Sends post data
    grant_type (seen as "password" atm)
    user_id (username)
    password (sha1 hash?)
*/
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