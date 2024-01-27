const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const fs = require('fs');
const path = require('path');
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

route.get("/@current/status", (req, res) => {
    // TODO: Find ban message and stuff and check if the device is allowed to create ANIDs (AltNNAS Network IDs)
    res.send(xmlbuilder.create({device:{}}).end({pretty: false, allowEmpty: false}));
})

module.exports = route