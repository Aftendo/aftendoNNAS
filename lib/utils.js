const logger = require("logger");
const xmlbuilder = require("xmlbuilder");

const utils = { // i forgot what i was going to do with this..
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