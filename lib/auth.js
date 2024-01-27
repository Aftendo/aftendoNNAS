const xmlbuilder = require("xmlbuilder");
const nn_error = require("nn_error")

function auth(req, res, next) {
    //Checking for correct verison (Latest Version)
    const version = req.headers['x-nintendo-system-version'];
    const platform_id = req.headers['x-nintendo-platform-id'];
    const device_type = req.headers['x-nintendo-device-type'];
    const device_id = req.headers['x-nintendo-device-id'];

    if (version != "0270") {
        res.setHeader("Content-Type", "application/xml")
        res.status(403).send(nn_error.createError("0011", "System update is required."));
    }
    next();
}

module.exports = auth