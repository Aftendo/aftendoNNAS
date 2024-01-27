const express = require('express');
const route = express.Router();

/*
    This is the api path the Wii U/3DS calls to when creating a new user.
    Content-Type: XML
*/
route.post("/", (req, res) => {
    console.log(req.body);
})

/*
    This is the API path the Wii U/3DS calls to when asking if a Network ID is already taken.
    Content-Type: XML
*/
route.get("/:network_id", (req, res) => {
    res.send("This will be real one day.. :(")
})

module.exports = route;