const logger = require("logger");
const xmlbuilder = require("xmlbuilder");
const knex = require("db");
const nn_error = require("nn_error");
const crypto = require("node:crypto");
const moment = require("moment");

const config = require("../config.json");

const utils = {
    arrayBufferToBase64(buffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa( binary );
    },
    
    // Convert a hex string to a byte array
    hexToBytes(hex) {
        let bytes = [];
        for (let c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    },

    // Convert a byte array to a hex string
    bytesToHex(bytes) {
        let hex = [];
        for (let i = 0; i < bytes.length; i++) {
            let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
            hex.push((current >>> 4).toString(16));
            hex.push((current & 0xF).toString(16));
        }
        return hex.join("");
    },

    ServiceToken: class {
        #pid = null;
        #user_id = null;
        #device_id = null;
        #platform_id = null;
        #expires_at = null;

        constructor(pid, user_id, device_id, platform_id) {
            this.#pid = pid;
            this.#user_id = user_id;
            this.#device_id = device_id;
            this.#platform_id = platform_id;
            this.#expires_at = moment().add(1, 'days').format();
        }

        toString() {
            return `pid\\${this.#pid}\\user_id\\${this.#user_id}\\device_id\\${this.#device_id}\\platform_id\\${this.#platform_id}\\expires_at\\${this.#expires_at}`;
        }
    },
    
    // Getting user data will be possible in anid.js soon..
    async generateServiceToken() {

        const key = await crypto.subtle.importKey("raw",
        Buffer.from(this.hexToBytes(config.encryption_keys.service_token[0])),
        {
            name: "AES-CBC"
        },
        false,
        [
            "encrypt",
            "decrypt"
        ]);

        return this.arrayBufferToBase64(await crypto.subtle.encrypt({
            name: "AES-CBC",
            iv: Buffer.from(this.hexToBytes(config.encryption_keys.service_token[1]))
        }, 
        key, 
        Buffer.from(new this.ServiceToken(1000000000, "prodtestt1", "asddasdasdasdasdsaed", 1).toString())));
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
    }
}

module.exports = utils;