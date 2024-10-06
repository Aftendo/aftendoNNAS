const logger = require("logger");
const xmlbuilder = require("xmlbuilder");
const knex = require("db");
const nn_error = require("nn_error");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const moment = require("moment");

const config = require("../config.json");

const utils = {
    /**
     * @typedef ServiceToken
     * @property {boolean} is_valid True if token is valid, false if token has expired
     * @property {number} pid - Principal ID of the user
     * @property {string} user_id - Network ID of the user
     * @property {number} device_id - Device ID of the user
     * @property {number} platform_id - Platform ID of user (0 = 3DS, 1 = Wii U)
     * @property {string} mii_data - Base64 data of user's mii
     * @property {string} mii_hash - Hash of user's mii
     * @private @property {string} expires_at - Expiration time of service token (formatted as YYYY-MM-DDTHH:mm:ss)
     */

    ServiceToken: class {
        /**
         * True if token is valid, false if token has expired
         * @type {boolean}
         * @public
         */
        is_valid = true;
    
        /**
         * Principal ID of user
         * @type {number}
         * @public
         */
        pid = null;
        /**
         * Network ID of user
         * @type {string}
         * @public
         */
        user_id = null;
        /**
         * Device ID of user
         * @type {number}
         * @public
         */
        device_id = null;
        /**
         * Platform ID of user (0 = 3DS, 1 = Wii U)
         * @type {number}
         * @public
         */
        platform_id = null;
        /**
         * Base64 data of user's mii
         * @type {string}
         * @public
         */
        mii_data = null;
        /**
         * Hash of user's mii
         * @type {string}
         * @public
         */
        mii_hash = null;
        
        /**
         * Expiration time of service token (formatted as YYYY-MM-DDTHH:mm:ss)
         * @type {number}
         * @private
         */
        expires_at = null;
    
        /**
         * Creates an instance of the ServiceToken object with the input parameters
         * @param {string|number} pid - The principal ID of the user
         * @param {string} user_id - The network ID of the user
         * @param {string|number} device_id - The device ID of the user
         * @param {string|number} platform_id - The platform ID of the user (0 = 3DS, 1 = Wii U)
         * @param {string} mii_data - The base64 encoded data of the user's mii
         * @param {string} mii_hash - The hash of the user's mii
         * @param {string} expires_at - Expiration time of service token (formatted as YYYY-MM-DDTHH:mm:ss)
         * @returns {ServiceToken}
         */
        constructor(pid, user_id, device_id, platform_id, mii_data, mii_hash, expires_at) {
            this.pid = Number(pid);
            this.user_id = user_id;
            this.device_id = Number(device_id);
            this.platform_id = Number(platform_id);
            this.mii_data = mii_data;
            this.mii_hash = mii_hash;
            if (expires_at) this.expires_at = expires_at;
            else this.expires_at = moment().add(1, 'days').format("YYYY-MM-DDTHH:mm:ss");
        }
    
        /**
         * Creates an instance of the ServiceToken object using an input service token and AES-256 keys
         * @param {string} service_token - The base64 encoded service token, optionally starting with "anid-"
         * @param {string} service_token_key - The hex string representation of the AES-256 encryption key
         * @param {string} service_token_iv - The hex string representation of the AES-256 encryption iv
         * @returns {Promise<ServiceToken>}
         */
        static async fromEncryptedString(service_token, service_token_key, service_token_iv) {
            if (service_token.startsWith("anid-")) service_token = service_token.slice(5);
    
            const key =
                await crypto.subtle.importKey(
                    "raw",
                    Buffer.from(service_token_key, "hex"),
                    { name: "AES-CBC" },
                    false,
                    ["encrypt", "decrypt"]
                );
    
            const json = JSON.parse(
                Buffer.from(await crypto.subtle.decrypt(
                    { name: "AES-CBC", iv: Buffer.from(service_token_iv, "hex") },
                    key,
                    Buffer.from(service_token, "base64")
                )).toString()
            );
    
            var token = new this(json.pid, json.user_id, json.device_id, json.platform_id, json.mii_data, json.mii_hash, json.expires_at);
            
            if (moment(json.expires_at).isBefore(moment())) token.is_valid = false;
            
            return token;
        }
    
        /**
         * Converts ServiceToken instance to string
         * @returns {string} JSON string in format of {"pid": pid, "user_id": "user_id", "device_id": device_id, "platform_id": platform_id, "mii_data": "mii_data", "mii_hash": "mii_hash", "expires_at": "expires_at"}
         */
        toString() {
            return JSON.stringify({
                pid: this.pid,
                user_id: this.user_id,
                device_id: this.device_id,
                platform_id: this.platform_id,
                mii_data: this.mii_data,
                mii_hash: this.mii_hash,
                expires_at: this.expires_at
            }, null, '\t')
        }
    
        async toEncryptedString(service_token_key, service_token_iv) {
            const key =
                await crypto.subtle.importKey(
                    "raw",
                    Buffer.from(service_token_key, "hex"),
                    { name: "AES-CBC" },
                    false,
                    ["encrypt", "decrypt"]
                );
    
            return "anid-" + Buffer.from(
                await crypto.subtle.encrypt(
                    { name: "AES-CBC", iv: Buffer.from(service_token_iv, "hex") },
                    key,
                    Buffer.from(this.toString())
                )
            ).toString("base64")
        }
    },

    async generateServiceToken(me, platformId) {
        var service_token = new this.ServiceToken(me.id, me.user_id, platformId == 1 ? me.deviceId_wup : me.deviceId_ctr, platformId, me.mii.data, me.mii.hash);
        return service_token.toEncryptedString(config.encryption_keys.service_token[0], config.encryption_keys.service_token[1]);
    },

    async generateServiceTokenString(service_token) {
        var token = await this.ServiceToken.fromEncryptedString(service_token, config.encryption_keys.service_token[0], config.encryption_keys.service_token[1]);
        return token.toString();
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

    nb64torb64(encoded) {
        encoded = encoded.replaceAll('.', '+').replaceAll('-', '/').replaceAll('*', '=');
        return Buffer.from(encoded, 'base64');
    },

    rb64tonb64(decoded) {
        const encoded = Buffer.from(decoded).toString('base64');
        return encoded.replaceAll('+', '.').replaceAll('/', '-').replaceAll('=', '*');
    },
    
    async verifyPassword(nn_password, password) {
        return await new Promise((resolve, reject) => {
            bcrypt.compare(nn_password, password, function (err, res) {
                if (err) reject(err);

                if (res) {
                    resolve(true)
                } else {
                    resolve(false);
                }
            });
        });
    },

    makeUserData(me) {
        // Hacky way to fix this
        //me.birth_date = me.birth_date.split("T")[0];
        me.birth_date = moment(me.birth_date).format("YYYY-MM-DD");
        me.created_on = moment(me.created_on).format("YYYY-MM-DDTHH:mm:ss");
        me.updated_at = moment(me.created_on).format("YYYY-MM-DDTHH:mm:ss");
        me.mii.data = me.mii.data.toString().replace("\n", "");
        var data = xmlbuilder.create({
            person: {
                active_flag: "Y",
                birth_date: me.birth_date,
                country: me.country,
                create_date: me.created_on,
                device_attributes: {},
                gender: me.gender,
                language: me.language,
                updated: me.updated_at,
                marketing_flag: me.marketing_flag,
                off_device_flag: me.off_device_flag,
                pid: me.id,
                email: {
                    address: me.email.email,
                    id: me.email.id,
                    parent: "N",
                    primary: "Y",
                    reachable: me.email.reachable,
                    type: me.email.type,
                    updated_by: me.email.updated_by,
                    validated: me.email.validated,
                },
                mii: {
                    status: me.mii.status,
                    data: me.mii.data,
                    id: me.mii.id,
                    mii_hash: me.mii.hash,
                    mii_images: {
                        mii_image: {
                            cached_url: "https://mii-secure.account.nintendo.net/1620d01kdfnr1_standard.tga",
                            id: me.mii.id,
                            url: "https://mii-secure.account.nintendo.net/1620d01kdfnr1_standard.tga",
                            type: "standard"
                        }
                    },
                    name: me.mii.name,
                    primary: me.mii.primary_mii
                },
                region: me.region,
                tz_name: me.tz_name,
                user_id: me.user_id,
                utc_offset: me.user_utc_offset,
            }
        }).end({ pretty: false, allowEmpty: true });
        data = data.replace("&#xD;", "");
        return data;
    }
}

module.exports = utils;
