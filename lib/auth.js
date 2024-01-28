const xmlbuilder = require("xmlbuilder");
const logger = require("logger");
const config = require("../config.json");
const knex = require("db");
const nn_error = require("nn_error")

/*
TODO:
- Check auth should have a parameter that allows authorization for signed out users
- or.. put that in a different function? idk.
*/
const auth = {
    checkAuth(req, res, next) {
        //Checking for correct verison (Latest Version)
        const sys_version = req.headers['x-nintendo-system-version'];
        const platform_id = req.headers['x-nintendo-platform-id'];
        const device_type = req.headers['x-nintendo-device-type'];
        const device_id = req.headers['x-nintendo-device-id'];
    
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
                    next();
                }
            })
            .catch(err => {
                console.error(err);
                res.setHeader("Content-Type", "application/xml");
                res.status(500).send(utils.generateServerError());
                return false;
            })
    },

    getConsoleDataBySerial: function(serial) {
        knex.select('id')
            .from('devices')
            .where({
				serialNumber: serial
			})
            .then(rows => {
                if (rows.length == 0) {
                    return false;
                } else {
                    return rows[0];
                }
            })
            .catch(err => {
                logger.error(err);
                return false;
            })
    },

    createConsoleData(deviceId, serialNumber, deviceType, platformId, systemVersion, language, region, country, cert) {
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
            .then(function(){
                return true;
            })
            .catch(err => {
                console.log(err);
                return false;
            })
    }
}

module.exports = auth