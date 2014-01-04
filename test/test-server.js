/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

var http = require('http');
var PinbaRequest = require('../').Request;

http.createServer(function (req, res) {
  var pr = new PinbaRequest({
    schema:       'http',
    server_name:  'node-pinba.tld',
    pinba_server: 'cpp1.d3'
  });

  var timer_head = pr.timerStart({group: 'writeHead'});
  res.writeHead(200, {'Content-Type': 'text/plain'});
  pr.timerStop(timer_head);

  var timer_body = pr.timerStart({group: 'write'});
  res.write('Hello World');
  pr.timerStop(timer_body);

  res.end();
  pr.flush();
}).listen(3000, '127.0.0.1');
