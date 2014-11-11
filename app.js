var express = require('express');
var morgan  = require('morgan');
var app = express();

app.use(morgan('tiny'));

app.get('/ajax', function (req, res) {
  console.log(req.query);
  res.send('gotcha');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get(/^(.+)$/, function (req, res) {
  res.sendFile(__dirname + req.params[0]);
});

app.listen(3000, function () {
  console.log('The server is listening localhost:3000');
});
