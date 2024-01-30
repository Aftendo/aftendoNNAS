const express = require('express');
const logger = require('logger');
const knex = require('db');
const auth = require('auth');
const path = require("path");
const utils = require("utils");
const fs = require("fs");
const nn_error = require('nn_error');
const route = express.Router();

const xmlbuilder = require("xmlbuilder");
const anid = require('anid');
const { getUserDataByToken } = require('../../../lib/anid');

/*
	This is the api path the Wii U/3DS calls to when creating a new user.
	Content-Type: XML
*/

route.use((req, res, next) => {
	auth.checkAuth(req, res, next);
});

route.post("/", (req, res) => {
	const person = req.body.person;
	const headers = req.headers;
	res.setHeader("Content-Type", "application/xml");

	logger.log(`[/v1/api/people] Account creation`);
	try {
		var consoleData = auth.getConsoleDataBySerial(headers['x-nintendo-serial-number']);
		if (!consoleData) {
			if (auth.createConsoleData(headers['x-nintendo-device-id'], headers['x-nintendo-serial-number'], headers['x-nintendo-device-type'], headers['x-nintendo-platform-id'], headers['x-nintendo-system-version'], headers['accept-language'], headers['x-nintendo-region'], headers['x-nintendo-country'], headers['x-nintendo-device-cert']) == false) {
				logger.error(`[people]: Failed to create console data!\n
			device id: ${headers['x-nintendo-device-id']}\n
			serial: ${headers['x-nintendo-serial-number']}`);

				res.status(500).send(utils.generateServerError());
				return;
			} else {
				consoleData = auth.getConsoleDataBySerial(headers['x-nintendo-serial-number'])
				if (!consoleData) {
					logger.error(`[people]: Console data was created by createConsoleData, but cannot seem to be fetched by the DB!\n
				device id: ${headers['x-nintendo-device-id']}\n
				serial: ${headers['x-nintendo-serial-number']}`);
				} else {
					logger.log(`[people]: Added new console data!\n
				device id: ${headers['x-nintendo-device-id']}\n
				serial: ${headers['x-nintendo-serial-number']}`);
				}
			}
		}

		const pid = anid.createUser(
			consoleData.platformId,
			consoleData.deviceId,
			person.birth_date,
			person.user_id,
			person.password,
			person.country,
			person.language,
			person.tz_name,
			person.agreement,
			person.email,
			person.mii,
			person.parental_consent,
			person.gender,
			person.region,
			person.marketing_flag,
			person.device_attributes[0].device_attribute[0].value,
			person.device_attributes[0].device_attribute[1].value,
			person.device_attributes[0].device_attribute[2].value,
			person.device_attributes[0].device_attribute[3].value,
			person.device_attributes[0].device_attribute[4].value,
			person.off_device_flag);

		if (pid == false) {
			logger.error("[people]: Failed to create user!");
			res.setHeader("Content-Type", "application/xml");
			res.status(500).send(utils.generateServerError());
			return;
		}
		res.status(200).send(xmlbuilder.create({
			person: {
				pid: pid
			}
		}).end({ pretty: true, allowEmpty: true }));
	} catch (e) {
		res.setHeader("Content-Type", "application/xml");
		res.status(500).send(utils.generateServerError());
	}
})

/* 
	This is the api path the Wii U/3DS calls to when getting account info (???).
	Content-Type: XML
*/
route.get(["/@me/profile", "/@me/devices/"], (req, res) => {
	const token = req.headers['authorization'].toString();
	const me = getUserDataByToken(token);
	if (me == false) {
		res.status(400).send(nn_error.createError("2641", "Token is expired"));
		return;
	}
	res.status(200).send(xmlbuilder.create({
		person: {
			active_flag: "Y",
			birth_date: me.birth_date,
			country: me.country,
			create_date: me.created_on,
			device_attributes: {
				device_attribute: {
					created_date: me.created_on,
					name: "persistent_id",
					value: me.persistent_id
				},
				device_attribute: {
					created_date: me.created_on,
					name: "transferable_id_base",
					value: me.transferable_id_base
				},
				device_attribute: {
					created_date: me.created_on,
					name: "transferable_id_base_common",
					value: me.transferable_id_base_common
				},
				device_attribute: {
					created_date: me.created_on,
					name: "uuid_account",
					value: me.uuid_account
				},
				device_attribute: {
					created_date: me.created_on,
					name: "uuid_common",
					value: me.uuid_common
				}
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
	}).end({ pretty: true, allowEmpty: true }));
})

route.put("/@me/miis/@primary", (req, res) => {
	const token = req.headers['authorization'].toString();
	const me = getUserDataByToken(token);
	if (me == false) {
		res.status(400).send(nn_error.createError("2641", "Token is expired"));
		return;
	}
	const mii = req.body.mii;
	knex("mii")
		.where('pid', me.id)
		.update({
			name: mii.name,
			data: mii.data,
			primary_mii: mii.primary
		})
		.then(function () {
			knex("people")
				.where('id', me.id)
				.update({
					updated_at: knex.fn.now()
				})
				.then(function () {
					res.sendStatus(200);
				})
				.catch(err => {
					logger.error(`[people]: Failed to update updated_at time for ${me.user_id}! Will return success anyway.`);
					res.sendStatus(200);
				})
		})
		.catch(err => {
			logger.error(`[people]: Failed to update Mii for ${me.user_id}`);
			res.status(500).send(utils.generateServerError());
		});
});

/* 
	This is the api path the Wii U/3DS calls to when deleting an account from the server.
	Content-Type: XML
*/
route.post("/@me/deletion", (req, res) => {
	res.setHeader("Content-Type", "application/xml");
	res.status(200);
})

/*
	This is the API path the Wii U/3DS calls to when asking if a Network ID is already taken.
	Content-Type: XML
	
	If the NNID is already in use, you should send a 401.
	If the NNID is available, send a 200.
	You don't need to send any data with the request.(?)
*/
route.get("/:network_id", (req, res) => {
	if (req.params.network_id.length < 6 || req.params.network_id.length > 16) {
		res.status(403).send(nn_error.createError("1104", "User ID format is not valid"));
		return;
	}
	knex.select('id')
		.from('people')
		.where('user_id', req.params.network_id)
		.then(rows => {
			if (rows.length != 0) {
				res.status(401).send(nn_error.createError("0100", "Account ID already exists"));
			} else {
				res.status(200).send(req.params.network_id);
			}
		})
		.catch(err => {
			console.error(err);
			res.status(500).send(utils.generateServerError());
		})
})

module.exports = route;

/*
https://account.nintendo.net/v1/api/people/
<person>
	<birth_date>1990-01-01</birth_date>
	<user_id>prodtest694202</user_id>
	<password>abc123!</password>
	<country>US</country>
	<language>en</language>
	<tz_name>America/New_York</tz_name>
	<agreement>
		<agreement_date>2024-01-27T03:54:26</agreement_date>
		<country>US</country>
		<location>https://account.nintendo.net/v1/api/content/agreements/Nintendo-Network-EULA/0300</location>
		<type>NINTENDO-NETWORK-EULA</type>
		<version>0300</version>
	</agreement>
	<email>
		<address>g@gmail.com</address>
		<owned>N</owned>
		<parent>N</parent>
		<primary>Y</primary>
		<validated>N</validated>
		<type>DEFAULT</type>
	</email>
	<mii>
		<name>mii</name>
		<primary>Y</primary>
		<data>AwAAQOAxUUHCBUAC3TuEluyqDwuZyAAAAEBtAGkAaQAAAEEATQBFAAAAAAAAAEBAAAAhAQJoRBgm
			NEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAACER</data>
	</mii>
	<parental_consent>
		<scope>1</scope>
		<consent_date>2024-01-27T03:54:26</consent_date>
		<approval_id>0</approval_id>
	</parental_consent>
	<gender>M</gender>
	<region>822083584</region>
	<marketing_flag>N</marketing_flag>
	<device_attributes>
		<device_attribute>
			<name>uuid_account</name>
			<value>3df87938-bca7-11ee-9413-010144224d99</value>
		</device_attribute>
		<device_attribute>
			<name>uuid_common</name>
			<value>1fb73b76-0b82-11ed-9413-010144224d99</value>
		</device_attribute>
		<device_attribute>
			<name>persistent_id</name>
			<value>80000042</value>
		</device_attribute>
		<device_attribute>
			<name>transferable_id_base</name>
			<value>1140000444224d99</value>
		</device_attribute>
		<device_attribute>
			<name>transferable_id_base_common</name>
			<value>0c80000444224d99</value>
		</device_attribute>
	</device_attributes>
	<off_device_flag>N</off_device_flag>
</person>
*/