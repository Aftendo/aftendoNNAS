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

route.get("/agreements/Nintendo-Network-EULA/:region/@latest", (req, res) => {
    const region = req.params['region']; // TODO: create other region specific agreements
    let agreements = path.resolve(__dirname, "agreements");
    const agreementRegion = path.join(agreements, `${region}.xml`);
    res.setHeader("Content-Type", "application/xml");
    if (fs.existsSync(agreementRegion)) {
        res.sendFile(agreementRegion);
    } else {
        logger.error(`[content]: File ${agreementRegion} for regional agreements cannot be found.`);
        res.status(404).send(nn_error.createError("0008", "Not found"));
    }
});

route.get("/time_zones/:region/:lang", (req, res) => {
    const region = req.params['region'];
    const lang = req.params['lang'];
    let time_zones = path.resolve(__dirname, "time_zones");
    const timezoneList = path.join(time_zones, region, `${lang}.xml`);
    res.setHeader("Content-Type", "application/xml");
    if (fs.existsSync(timezoneList)) {
        res.sendFile(timezoneList);
    } else {
        logger.error(`[content]: File ${tz_thingy} for timezones cannot be found.`);
        res.status(404).send(nn_error.createError("0008", "Not found"));
    }
});

module.exports = route;