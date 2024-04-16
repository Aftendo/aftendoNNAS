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

/*
	This is the api path the Wii U/3DS calls to when creating a new user.
	Content-Type: XML
*/

route.use((req, res, next) => {
	auth.checkAuth(req, res, next);
});

route.post("/", async (req, res) => {
	const person = req.body.person;
	const headers = req.headers;
	res.setHeader("Content-Type", "application/xml");

	logger.log(`[/v1/api/people] Account creation`);
	try {
		var consoleData = await auth.getConsoleDataBySerial(headers['x-nintendo-serial-number']);
		if (!consoleData) {
			if (auth.createConsoleData(headers['x-nintendo-device-id'], headers['x-nintendo-serial-number'], headers['x-nintendo-device-type'], headers['x-nintendo-platform-id'], headers['x-nintendo-system-version'], headers['accept-language'], headers['x-nintendo-region'], headers['x-nintendo-country'], headers['x-nintendo-device-cert']) == false) {
				logger.error(`[people]: Failed to create console data!\n
			device id: ${headers['x-nintendo-device-id']}\n
			serial: ${headers['x-nintendo-serial-number']}`);

				res.status(500).send(utils.generateServerError());
				return;
			} else {
				consoleData = await auth.getConsoleDataBySerial(headers['x-nintendo-serial-number'])
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

		const pid = await anid.createUser(
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

route.get("/@me/profile", async (req, res) => {
	var data = utils.makeUserData(req.me);
	res.setHeader("Content-Type", "application/xml");
	res.setHeader("Content-Length", Buffer.byteLength(data));
	res.status(200).send(data);
})

route.get("/@me/devices/owner", async (req, res) => {
	let buffer = Buffer.from(req.headers["authorization"].toString().slice(6), "base64");
	let decoded = buffer.toString("utf8").split(" ");
	var user_id = decoded[0];
	var email = req.headers["x-nintendo-email"];
	const me = await anid.getUserDataByUserId(user_id);
	if (me.deviceId_wup != "" && req.headers["x-nintendo-platform-id"] == 1 || me.deviceId_ctr && req.headers["x-nintendo-platform-id"] == 0) {
		res.setHeader("Content-Type", "application/xml");
		res.status(400).send(nn_error.createError("0115", "Device association limit exceeded"));
	}
	const password = utils.nintendoPasswordHash(decoded[1], me.id);
	console.log(me.id);
	console.log(password);
	if (await utils.verifyPassword(password, me.password.toString()) == true) {
		res.setHeader("Content-Type", "application/xml");
		res.status(200).send(utils.makeUserData(me, true));
		return;
	} else {
		res.setHeader("Content-Type", "application/xml");
		res.status(400).send(nn_error.createError("1105", "Email address, or password, is not valid."));
		return;
	}
})

route.post("/@me/devices/", async (req, res) => {
	var headers = req.headers;
	let buffer = Buffer.from(headers["authorization"].toString().slice(6), "base64");
	let decoded = buffer.toString("utf8").split(" ");
	var user_id = decoded[0];
	var email = headers["x-nintendo-email"]; // TODO: Verify email
	try {
		var consoleData = await auth.getConsoleDataBySerial(headers['x-nintendo-serial-number']);
		if (!consoleData) {
			if (auth.createConsoleData(headers['x-nintendo-device-id'], headers['x-nintendo-serial-number'], headers['x-nintendo-device-type'], headers['x-nintendo-platform-id'], headers['x-nintendo-system-version'], headers['accept-language'], headers['x-nintendo-region'], headers['x-nintendo-country'], headers['x-nintendo-device-cert']) == false) {
				logger.error(`[people]: Failed to create console data!\n
			device id: ${headers['x-nintendo-device-id']}\n
			serial: ${headers['x-nintendo-serial-number']}`);
			}
		}
		user = await anid.getUserDataByUserId(user_id);
		if (user.deviceId_wup && req.headers["x-nintendo-platform-id"] == 1 || user.deviceId_ctr && req.headers["x-nintendo-platform-id"] == 0) {
			res.status(400).send(nn_error.createError("0115", "Device association limit exceeded<"));
		}
		const password = utils.nintendoPasswordHash(decoded[1], user.id);
		if (await utils.verifyPassword(password, user.password.toString())) {
			if (req.headers["x-nintendo-platform-id"] == 1) {
				knex('people').where('id', user.id).update({ deviceId_wup: req.headers["x-nintendo-device-id"] })
					.then(function () {
						res.status(200).send(utils.makeUserData(user));
					});
			} else {
				knex('people').where('id', user.id).update({ deviceId_ctr: req.headers["x-nintendo-device-id"] })
					.then(function () {
						res.status(200).send(utils.makeUserData(user));
					});
			}
		}
	} catch (e) {
		console.error(e);
		res.status(500).send(utils.generateServerError());
	}
})

route.post("/@me/devices/@current/attributes", async (req, res) => {
	res.send('');
})

route.get("/@me/emails", async (req, res) => {
	const me = req.me;
	res.send(xmlbuilder.create({
		emails: {
			email: {
				address: me.email.email,
				id: me.email.id,
				parent: "N",
				primary: "Y",
				reachable: me.email.reachable,
				type: me.email.type,
				updated_by: me.email.updated_by,
				validated: me.email.validated,
			}
		}
	}).end({ pretty: false, allowEmpty: true }));
});

route.post("/@me", async (req, res) => {
	const person = req.body.person;
	const gender = person.gender ? person.gender : req.me.gender;
	const region = person.region ? person.region : req.me.region;
	//const timezoneName = person.tz_name ? person.tz_name : req.me.tz_name; // TODO: Update UTC offset with timezone
	const marketingFlag = person.marketing_flag ? person.marketing_flag : req.me.marketing_flag;
	const offDeviceFlag = person.off_device_flag ? person.off_device_flag : req.me.off_device_flag;
	try {
		await knex("people").where('id', me.id).update({
			gender: gender,
			region: region,
			marketing_flag: marketingFlag,
			off_device_flag: offDeviceFlag
		});
		res.setHeader("Content-Type", "application/xml");
		res.status(200);
	} catch (e) {
		console.log(e);
		res.status(500).send(utils.generateServerError);
	}
});

route.put("/@me/miis/@primary", (req, res) => {
	const token = req.headers['authorization'].toString();
	const me = req.me;
	const mii = req.body.mii;
	knex("mii")
		.where('pid', me.id)
		.update({
			name: mii.name,
			data: mii.data.toString().replace("\n", ""),
			primary_mii: mii.primary
		})
		.then(function () {
			knex("people")
				.where('id', me.id)
				.update({
					updated_at: knex.fn.now()
				})
				.then(function () {
					res.send(''); // Patch for 3DS not accepting node's res.sendStatus(200); sending "OK" in response body
				})
				.catch(err => {
					logger.error(`[people]: Failed to update updated_at time for ${me.user_id}! Will return success anyway.`);
					res.send('');
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
				res.status(200).send();
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