const xmlbuilder = require("xmlbuilder");
const knex = require("db");
const nn_error = require("nn_error")

const auth = {
    checkAuth: function checkAuth(req, res, next) {
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
                    }
                    next();
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500)
            })
    }
}

module.exports = auth