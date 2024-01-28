const logger = require("logger");
const xmlbuilder = require("xmlbuilder");

const nn_error = {
    createError(code, message) {
        return xmlbuilder.create({errors: {
            error: {
                code: code,
                message: message
            }
        }}).end({pretty: true, allowEmpty: true})
    }
}

module.exports = nn_error;