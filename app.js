var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get(/^(.+)$/, function (req, res) {
  res.sendFile(__dirname + req.params[0]);
});

app.listen(3000, function () {
  console.log('The server is listening localhost:3000');
});
