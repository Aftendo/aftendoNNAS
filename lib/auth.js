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
                    logger.log(serial);
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
                    logger.log(serial);
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
        const sys_version = req.headers['x-nintendo-system-version'];
        const platform_id = req.headers['x-nintendo-platform-id'];
        const device_type = req.headers['x-nintendo-device-type'];
        const device_id = req.headers['x-nintendo-device-id'];
        const serial = req.headers['x-nintendo-serial-number'];
        const cert = req.headers['x-nintendo-device-cert'];
        const token = req.headers["authorization"];

        if (cert && new nn_certs(cert).valid == false) {
            logger.error("[auth]: Authentication was attempted with an invalid certificate!");
            res.status(403).send(nn_error.createError("0011", "System update is required.")); // Maybe they need to update or something.
            return false;
        }
        try {
            var consoleData = await this.getConsoleDataBySerial(serial);
            if (consoleData) {
                if (consoleData.deviceId != device_id) {
                    logger.error("[auth]: Authentication was attempted but headers did not match DB! (dev id)");
                    res.status(403).send(nn_error.createError("0011", "System update is required.")); // Generic error I guess
                    return false;
                }
                if (cert && consoleData.cert != cert) {
                    logger.error("[auth]: Authentication was attempted but headers did not match DB! (cert)");
                    res.status(403).send(nn_error.createError("0011", "System update is required."));
                    return false;
                }
            }

            knex.select('value')
                .from('latest')
                .where('name', 'version')
                .then(rows => {
                    if (rows.length > 0) {
                        if (sys_version != rows[0].value) {
                            res.setHeader("Content-Type", "application/xml")
                            res.status(403).send(nn_error.createError("0011", "System update is required."));
                            return;
                        }
                        if (token) {
                            knex.select('expires')
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
                                        var me = await anid.getUserDataByToken(token);

                                        if(me == false){
                                            res.status(400).send(nn_error.createError("0112", "Account is deleted"));
                                            return;
                                        } else {
                                            if(me.rank < 0){
                                                res.status(400).send(nn_error.createError("0122", "Device has been banned by game server"));
                                                return;
                                            }
                                        }
                                        if(me.deviceId_wup != device_id && me.deviceId_ctr != device_id){
                                            res.sendStatus(403); // NUH UH!!
                                            return;
                                        }
                                        req.me = me;
                                        next();
                                    }
                                })
                                .catch(err => {
                                    console.error(err);
                                    res.setHeader("Content-Type", "application/xml");
                                    res.status(500).send(utils.generateServerError());
                                    return false;
                                })
                        } else {
                            next();
                        }
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.setHeader("Content-Type", "application/xml");
                    res.status(500).send(utils.generateServerError());
                    return false;
                })
        } catch (e) {
            console.error(e);
            res.setHeader("Content-Type", "application/xml");
            res.status(500).send(utils.generateServerError());
            return false;
        }
    }
}

module.exports = auth