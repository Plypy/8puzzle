var express = require('express');
var morgan  = require('morgan');
var exec = require('child_process').exec;
var app = express();

app.use(morgan('tiny'));

app.get('/ajax', function (req, res, next) {
  var child = exec('bin/astar', function (err, stdout) {
    if (err) {
      return next(err);
    }
    res.send(stdout);
  });
  child.stdin.write(req.query.state);
  child.stdin.end();
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
