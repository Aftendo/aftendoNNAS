const logger = require("logger");
const xmlbuilder = require("xmlbuilder");
const knex = require("db");
const nn_error = require("nn_error");

const utils = {
    /*
    didn't work :(
    checkCon: function checkCon(knex) {
        try {
            knex.raw('select 1+1 as result').then(function () {
                return true;
            });
        } catch(e) {
            throw `Failed to connect to database.\n${e}`;
            return false;
        }
    }
    */

    generateServiceToken: function generateServiceToken() {
        
    },

    generateNotFound: function generateNotFound(){
        return nn_error.createError("0008", "Not Found");
    },

    generateServerError: function generateServerError(){
        return nn_error.createError("2001", "Internal server error");
    }
}

module.exports = utils;