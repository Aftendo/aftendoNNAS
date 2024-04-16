const xmlbuilder = require("xmlbuilder");
const logger = require("logger");
const config = require("../config.json");
const knex = require("db");
const nn_certs = require("nintendo-certificates");
const nn_error = require("nn_error")
const moment = require("moment");
const utils = require("utils");

const anid = require("anid");

/*
TODO:
- Check auth should have a parameter that allows authorization for signed out users
- or.. put that in a different function? idk.
*/
const auth = {
    createConsoleData(deviceId, serialNumber, deviceType, platformId, systemVersion, language, region, country, cert) {
        if (new nn_certs(cert).valid == false) {
            logger.error("Console data was attempted to be created by invalid cert!");
            return false;
        }
        knex("devices").insert({
            deviceId: deviceId,
            serialNumber: serialNumber,
            deviceType: deviceType,
            platformId: platformId,
            systemVersion: systemVersion,
            language: language,
            region: region,
            country: country,
            cert: cert
        })
            .then(function () {
                return true;
            })
            .catch(err => {
                console.log(err);
                return false;
            })
    },

    getConsoleDataBySerial(serial) {
        return knex.select('*')
            .from('devices')
            .where({
                serialNumber: serial
            })
            .then(rows => {
                if (rows.length == 0) {
                    return false;
                } else {
                    return JSON.parse(JSON.stringify(rows[0]));
                }
            })
            .catch(err => {
                logger.error(err);
                return false;
            })
    },

    getConsoleDataByDeviceId(devId) {
        return knex.select('*')
            .from('devices')
            .where({
                deviceId: devId
            })
            .then(rows => {
                if (rows.length == 0) {
                    return false;
                } else {
                    return JSON.parse(JSON.stringify(rows[0]));
                }
            })
            .catch(err => {
                logger.error(err);
                return false;
            })
    },

    async checkAuth(req, res, next) {
        res.setHeader('X-Nintendo-Date', new Date().getTime());
        const sys_version = req.headers['x-nintendo-system-version'];
        const platform_id = req.headers['x-nintendo-platform-id'];
        const device_type = req.headers['x-nintendo-device-type'];
        const device_id = req.headers['x-nintendo-device-id'];
        const serial = req.headers['x-nintendo-serial-number'];
        const cert = req.headers['x-nintendo-device-cert'];
        const token = req.headers["authorization"];

        if (cert && new nn_certs(cert).valid == false) {
            if(platform_id == 1){
                logger.error("[auth]: Authentication was attempted with an invalid certificate!");
                res.status(403).send(nn_error.createError("0011", "System update is required.")); // Maybe they need to update or something.
                return false;
            }
        }
        try {
            var consoleData = await this.getConsoleDataBySerial(serial);
            if (consoleData) {
                if(consoleData.status < 0)
                if (consoleData.deviceId != device_id) {
                    logger.error("[auth]: Authentication was attempted but headers did not match DB! (dev id)");
                    res.status(403).send(nn_error.createError("0011", "System update is required.")); // Generic error I guess
                    return false;
                }
                /*
                if (cert && consoleData.cert != cert) {
                    logger.error("[auth]: Authentication was attempted but headers did not match DB! (cert)");
                    console.log(consoleData.cert);
                    res.status(403).send(nn_error.createError("0011", "System update is required."));
                    return false;
                }
                */
            }

            knex.select('value', 'platform')
                .from('latest')
                .where('name', 'version')
                .then(rows => {
                    if (rows.length > 0) {
                        var ver;
                        for (let i=0; i < rows.length; i++){
                            if(rows[i].platform == platform_id){
                                ver = rows[i].value;
                                break;
                            }
                        }
                        if (sys_version != ver) {
                            res.setHeader("Content-Type", "application/xml")
                            res.status(403).send(nn_error.createError("0011", "System update is required."));
                            return;
                        }
                        if (token && token.includes("Bearer")) {
                            knex.select('expires', 'pid')
                                .from('access_tokens')
                                .where('token', token.toString().slice(7))
                                .then(async rows => {
                                    if (rows.length == 0) {
                                        res.status(400).send(nn_error.createError("2641", "Token is expired")); // Assume scheduler deleted expired token
                                        return;
                                    } else if (moment(rows[0].expires).isBefore(moment())) {
                                        res.status(400).send(nn_error.createError("2641", "Token is expired"));
                                        return;
                                    } else {
                                        var me = await anid.getUserDataByPid(rows[0].pid);
                                        console.log(rows[0].pid);
                                        if (me == false) {
                                            res.status(400).send(nn_error.createError("0112", "Account is deleted"));
                                            return;
                                        } else {
                                            if (me.rank < 0) {
                                                res.status(400).send(nn_error.createError("0122", "Device has been banned by game server"));
                                                return;
                                            }
                                        }
                                        if (me.deviceId_wup != device_id && me.deviceId_ctr != device_id) {
                                            res.sendStatus(403);
                                            return;
                                        }
                                        req.me = me;
                                        next();
                                    }
                                })
                        } else {
                            next();
                        }
                    }
                })
        } catch (e) {
            logger.error("[auth]: checkAuth failed!");
            console.error(e);
            res.setHeader("Content-Type", "application/xml");
            res.status(500).send(utils.generateServerError());
            return false;
        }
    },

    async checkAuthApi(req, res, next) {
        //First we must check if the request is coming from a trusted application
        const api_key = req.body.api_key;
        console.log(req.body)
        if (!api_key) { res.sendStatus(403); return; }

        const result = (await knex.select("id", "status", "api_key")
            .from("external_applications")
            .where("api_key", api_key))[0];

        //If there's no result, or the status of the key is disabled, send an error.
        if (!result) {res.status(401).send({success : 0, error : "Sorry, the API_KEY given does not exist."}); return;}
        if (result.status === -1) {res.status(401).send({success: 0, error : "Sorry, the API_KEY given is disabled."}); return;}

        next();
    }
}

module.exports = auth