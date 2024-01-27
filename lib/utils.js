const logger = require("logger");
const xmlbuilder = require("xmlbuilder");

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
}

module.exports = utils;