const express = require('express');
const logger = require('logger');
const knex = require('db');
const auth = require('auth');
const nn_error = require('nn_error');
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

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

    logger.log(`[/v1/api/people] Account creation`);

    const xml = xmlbuilder.create({person: {
        pid: 1
    }}).end({pretty : true, allowEmpty : true})

    res.send(xml);
})

/* deletion roue

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
	if(req.params.network_id.length < 6 || req.params.network_id.length > 16){
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
            res.status(500).send(nn_error.createError("2001", "Internal server error"));
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