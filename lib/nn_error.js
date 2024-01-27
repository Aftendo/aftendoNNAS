const logger = require("logger");
const xmlbuilder = require("xmlbuilder");

const nn_error = {
    createError: function createError(code, message) {
        return xmlbuilder.create({errors: {
            error: {
                code: code,
                message: message
            }
        }}).end({pretty: true, allowEmpty: true})
    },

    /*
    broken
    createErrors: function createError(errors_input) {
        let errors = {errors: [

        ]}

        for (let error of errors_input) {
            //errors.errors.
            errors.errors.push({error:{code: error.code, message: error.message}});
            logger.log(`Error: Code ${error.code}, Message: ${error.message}`);
        }
        
        console.log(errors)
        return xmlbuilder.create(errors).end({pretty: true, allowEmpty: true});
    }
    */
}

module.exports = nn_error;