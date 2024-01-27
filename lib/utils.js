const logger = require("logger");
const xmlbuilder = require("xmlbuilder");

const utils = {
    create: function createError(code, message) {
        return xmlbuilder.create({errors: {
            error: {
                code: code,
                message: message
            }
        }}).end({pretty: true, allowEmpty: true})
    }
}

module.exports = utils;