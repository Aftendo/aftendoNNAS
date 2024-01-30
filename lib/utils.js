const logger = require("logger");
const xmlbuilder = require("xmlbuilder");
const knex = require("db");
const nn_error = require("nn_error");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const moment = require("moment");

const config = require("../config.json");

const utils = {
    ServiceToken: class {
        #pid = null;
        #user_id = null;
        #device_id = null;
        #platform_id = null;
        #mii_data = null;
        #mii_hash = null;

        #expires_at = null;

        constructor(pid, user_id, device_id, platform_id, mii_data, mii_hash) {
            this.#pid = pid;
            this.#user_id = user_id;
            this.#device_id = device_id;
            this.#platform_id = platform_id;
            this.#mii_data = mii_data;
            this.#mii_hash = mii_hash;
            
            this.#expires_at = moment().add(1, 'days').format();
        }

        toString() {
            return `pid\\${this.#pid}\\user_id\\${this.#user_id}\\device_id\\${this.#device_id}`
                 + `\\platform_id\\${this.#platform_id}\\mii_data\\${this.#mii_data}`
                 + `\\mii_hash\\${this.#mii_hash}\\expires_at\\${this.#expires_at}`;
        }

        async toEncryptedString(service_token_key, service_token_iv) {
            const key = 
                await crypto.subtle.importKey(
                    "raw",
                    Buffer.from(service_token_key, "hex"),
                    { name: "AES-CBC" },
                    false,
                    [ "encrypt", "decrypt" ]
                );
    
            return Buffer.from(
                await crypto.subtle.encrypt(
                    { name: "AES-CBC", iv: Buffer.from(service_token_iv, "hex")}, 
                    key, 
                    Buffer.from(this.toString())
                )
            ).toString("base64")
        }
    },
    
    // Getting user data will be possible in anid.js soon..
    async generateServiceToken(me, platformId) {
        var service_token = new this.ServiceToken(me.id, me.user_id, platformId == 1 ? me.deviceId_wup : me.deviceId_ctr, platformId, me.mii.data, me.mii.hash);
        return service_token.toEncryptedString(config.encryption_keys.service_token[0], config.encryption_keys.service_token[1]);
    },

    generateNotFound() {
        return nn_error.createError("0008", "Not Found");
    },

    generateServerError() {
        return nn_error.createError("2001", "Internal server error");
    },

    nintendoPasswordHash(password, pid) {
        const pidBuffer = Buffer.alloc(4);
        pidBuffer.writeUInt32LE(pid);
    
        const unpacked = Buffer.concat([
            pidBuffer,
            Buffer.from('\x02\x65\x43\x46'),
            Buffer.from(password)
        ]);
        const hashed = crypto.createHash('sha256').update(unpacked).digest().toString('hex');
    
        return hashed;
    },

    async verifyPassword(nn_password, password){
        return bcrypt.compare(nn_password, password, function(err, result) {
            if(result){
                return true;
            } else {
                return false;
            }
        });
    }
}

module.exports = utils;