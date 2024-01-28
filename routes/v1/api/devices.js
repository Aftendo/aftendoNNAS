const express = require('express');
const logger = require('logger');
const auth = require('auth');
const nn_error = require('nn_error');
const fs = require('fs');
const path = require('path');
const route = express.Router();

const xmlbuilder = require("xmlbuilder")

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

route.get("/@current/status", (req, res) => {
    // TODO: Find ban message and stuff and check if the device is allowed to create ANIDs (AltNNAS Network IDs)
    res.send(xmlbuilder.create({device:{}}).end({pretty: false, allowEmpty: false}));
})
/*
It seems the above URL just shows which devices are connected to your NNID
TODO: Get what it looks like when 3ds is linked
<devices>
	<device>
		<device_id>STRIPPED</device_id>
		<language>en</language>
		<updated>2024-01-27T03:36:44</updated>
		<pid>1738152139</pid>
		<platform_id>1</platform_id>
		<region>2</region>
		<serial_number>STRIPPED</serial_number>
		<status>ACTIVE</status>
		<system_version>0270</system_version>
		<type>RETAIL</type>
		<updated_by>USER</updated_by>
	</device>
</devices>
*/

module.exports = route