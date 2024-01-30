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

        constructor(pid, user_id, device_id, platform_id, mii_data, mii_hash) {
            this.#pid = pid;
            this.#user_id = user_id;
            this.#device_id = parseInt(device_id);
            this.#platform_id = parseInt(platform_id);
            this.#mii_data = mii_data;
            this.#mii_hash = mii_hash;
        }

        toString() {
            // return `pid\\${this.#pid}\\user_id\\${this.#user_id}\\device_id\\${this.#device_id}`
            //     + `\\platform_id\\${this.#platform_id}\\mii_data\\${this.#mii_data}`
            //     + `\\mii_hash\\${this.#mii_hash}\\expires_at\\${this.#expires_at}`;
            return JSON.stringify({
                pid: this.#pid,
                user_id: this.#user_id,
                device_id: this.#device_id,
                platform_id: this.#platform_id,
                mii_data: this.#mii_data,
                mii_hash: this.#mii_hash,
                expires_at: moment().add(1, 'days').format()
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

    async verifyPassword(nn_password, password) {
        return bcrypt.compare(nn_password, password, function (err, result) {
            if (result) {
                return true;
            } else {
                return false;
            }
        });
    },

    makeUserData(me) {
        return xmlbuilder.create({
            person: {
                active_flag: "Y",
                birth_date: me.birth_date,
                country: me.country,
                create_date: me.created_on,
                device_attributes: {
                    device_attribute: [
                        {
                            created_date: me.created_on,
                            name: "persistent_id",
                            value: me.persistent_id
                        },
                        {
                            created_date: me.created_on,
                            name: "transferable_id_base",
                            value: me.transferable_id_base
                        },
                        {
                            created_date: me.created_on,
                            name: "transferable_id_base_common",
                            value: me.transferable_id_base_common
                        },
                        {
                            created_date: me.created_on,
                            name: "uuid_account",
                            value: me.uuid_account
                        },
                        {
                            created_date: me.created_on,
                            name: "uuid_common",
                            value: me.uuid_common
                        }
                    ]
                },
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
                    validated: me.email.validated
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
                utc_offset: me.utc_offset
            }
        }).end({ pretty: true, allowEmpty: true })
    }
}

module.exports = utils;