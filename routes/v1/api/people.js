const express = require('express');
const route = express.Router();

/*
    This is the api path the Wii U/3DS calls to when creating a new user.
    Content-Type: XML
*/
route.post("/", (req, res) => {
    console.log(req.get("content-type"));
    console.log(req.body)
})

/*
    This is the API path the Wii U/3DS calls to when asking if a Network ID is already taken.
    Content-Type: XML
*/
route.get("/:network_id", (req, res) => {
    res.send(req.params.network_id);
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