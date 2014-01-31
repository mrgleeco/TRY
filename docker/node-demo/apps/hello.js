var http = require('http');
var os = require('os');
var hn = os.hostname();
var port = 80;
var ct = 1;
var tag = 'red';

var server = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('Hello World! You are request ' +  ct + ' at ' + hn +  ':' + port + ' tag=' + tag + "\n");
  ct++;
});
server.listen(port);
