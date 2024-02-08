const express = require('express');
const logger = require('logger');
const auth = require('auth');
const utils = require('utils');
const anid = require('anid');
const nn_error = require('nn_error');
const fs = require('fs');
const path = require('path');
const route = express.Router();

const xmlbuilder = require("xmlbuilder");

route.use((req, res, next) => {
    auth.checkAuth(req, res, next);
});

/*
    The api path the Wii U calls to check the date/time and refresh WWP if the date/time is past the expiry date in 1stNUP.xml.
*/

route.get("/time", (req, res) => {
    //res.setHeader('X-Nintendo-Date', new Date().getTime()); Now done in checkAuth()
    res.sendStatus(200);
});

route.get("/mapped_ids", async (req, res) => {
    // https://github.com/PretendoNetwork/account/blob/b75f63f846b8cd412add0f0cffb61e789d1822f1/src/services/nnid/routes/admin.js
    // Using the code structure from this file, because this endpoint is currently unresearched
    const type = req.query.input_type;
    const outType = req.query.output_type;
    if(type != "user_id" && type != "pid" || outType != "user_id" && outType != "pid"){
        res.sendStatus(400); // TODO: add bad request message
        return;
    }
        
    var inputArray = req.query.input;
    const output_type = req.query.output_type;
    inputArray = inputArray.split(',');
	inputArray = inputArray.filter(input => input);

    var output = [];

    for(var input of inputArray) {
        var result = {
            in_id: input,
            out_id: ''
        };

        if(type == "user_id"){
            const data = await anid.getUserDataByUserId(input);
            if(data){
                // assume pid because why would you ask for pid from a user_id..
                result.out_id = data.id;
            }
        } else {
            // assume pid for now
            const data = await anid.getUserDataByPid(input);
            if(data){
                result.out_id = data.user_id;
            }
        }
        output.push(result);
    }

    res.send(xmlbuilder.create({
        mapped_ids: {
            mapped_id: output
        }
    }).end({pretty: true, allowEmpty: true}));
})

module.exports = route;