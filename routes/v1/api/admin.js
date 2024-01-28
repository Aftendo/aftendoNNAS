const express = require('express');
const logger = require('logger');
const auth = require('auth');
const utils = require('utils');
const nn_error = require('nn_error');
const fs = require('fs');
const path = require('path');
const route = express.Router();

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

/*
    The api path the Wii U calls to check the date/time and refresh WWP if the date/time is past the expiry date in 1stNUP.xml.
*/

route.get("/time", (req, res) => {
    res.setHeader('X-Nintendo-Date', new Date().getTime());
    res.sendStatus(200);
});

module.exports = route;