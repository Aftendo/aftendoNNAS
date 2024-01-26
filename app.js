const express = require("express");
const app = express();

app.get('/', (req, res) => {
  res.send('altnnas')
});

app.listen(3001, () => {
  console.log("altnnas listening on 3001")
})
