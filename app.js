const express = require("express");
const config = require('config');
const app = express();

app.get('/', (req, res) => {
  res.send('altnnas');
});

app.listen(config.PORT, () => {
  console.log("altnnas listening on "+config.PORT);
})
