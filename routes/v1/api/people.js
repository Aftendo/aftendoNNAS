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
const anid = require('../../../lib/anid');

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

	if (!auth.getConsoleDataBySerial(headers['x-nintendo-serial-number'])) {
		if (auth.createConsoleData(headers['x-nintendo-device-id'], headers['x-nintendo-serial-number'], headers['x-nintendo-device-type'], headers['x-nintendo-platform-id'], headers['x-nintendo-system-version'], headers['accept-language'], headers['x-nintendo-region'], headers['x-nintendo-country']) == false) {
			logger.error(`[people]: Failed to create console data!\ndevice id: ${headers['x-nintendo-device-id']}\nserial: ${headers['x-nintendo-serial-number']}`);
			res.status(500).send(utils.generateServerError());
			return;
		} else {
			logger.log(`[people]: Added new console data\ndevice id: ${headers['x-nintendo-device-id']}\nserial: ${headers['x-nintendo-serial-number']}`);
		}
	}
	
	const pid = anid.createUser(
		headers['x-nintendo-platform-id'],
		headers['x-nintendo-device-id'],
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
		res.status(500).send(utils.generateServerError());
	}
	res.status(200).send(xmlbuilder.create({person: {
		pid: pid
	}}).end({pretty: true, allowEmpty: true}));
})

/* 
	This is the api path the Wii U/3DS calls to when getting account info (???).
	Content-Type: XML
*/
route.get("/@me/profile", (req, res) => {
	// TODO: Get information from DB (requires account to be made and inserted into db first)
	// DUMMY DATA BELOW
	res.setHeader("Content-Type", "application/xml");
	let data = path.resolve(__dirname, "test");
	const profile_xml = path.join(data, `profile.xml`);
	res.setHeader("Content-Type", "application/xml");
	if (fs.existsSync(profile_xml)) {
		res.sendFile(profile_xml);
	} else {
		logger.error(`[content]: File ${profile_xml} for test data cannot be found.`);
		res.status(404).send(utils.generateNotFound());
	}
})

/* 
	This is the api path the Wii U/3DS calls to when deleting an account from the server.
	Content-Type: XML
*/
route.post("/@me/deletion", (req, res) => {
	res.setHeader("Content-Type", "application/xml");
	res.status(200);
})

/*
	This is a test path.
	Content-Type: XML
*/
route.get("/test", (req, res) => {
	res.setHeader("Content-Type", "application/xml")
	res.send(nn_error.createError(1230, "URGAY"));
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