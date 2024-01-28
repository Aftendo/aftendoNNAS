const colors = require("colors");
const moment = require("moment")
const config = require("../config.json");

const logger = {
    log(msg) {
        console.log(`[INFO] (${moment().format("HH:mm:ss")}) ${msg}`.white);
    },

    warn(msg) {
        console.log(`[WARN] (${moment().format("HH:mm:ss")}) ${msg}`.yellow);
    },
    
    error(msg) {
        console.log(`[ERROR] (${moment().format("HH:mm:ss")}) ${msg}`.red);
    },

    http_log(req) {
        if(config.env.debug){
            switch (req.method) {
                case "GET":
                    console.log(`[GET] (${moment().format("HH:mm:ss")}) ${req.url}`.green);
                    break;
                case "POST":
                    console.log(`[POST] (${moment().format("HH:mm:ss")}) ${req.url}`.blue);
                    break;
                case "PUT":
                    console.log(`[PUT] (${moment().format("HH:mm:ss")}) ${req.url}`.orange);
                    break;
                case "DELETE":
                    console.log(`[DELETE] (${moment().format("HH:mm:ss")}) ${req.url}`.red);
                    break;
                default:
                    console.log(`[${req.method}] (${moment().format("HH:mm:ss")}) ${req.url}`.cyan);
                    break;
            }
        }
    }
}

module.exports = logger