const express = require('express');
const route = express.Router();

/*
    This is the api path the Wii U/3DS calls to when creating a new user.
    Content-Type: XML
*/
route.post("/", (req, res) => {
    console.log(req.body);
})

module.exports = route;