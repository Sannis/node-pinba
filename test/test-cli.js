/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

var PinbaRequest = require('../').Request;

var pr = new PinbaRequest({
  hostname:     'node-pinba',
  schema:       'http',
  server_name:  'node-pinba.tld',
  script_name:  '/handler',
  pinba_server: 'cpp1.d3'
});

console.log('Started.');
console.log(pr.getInfo());

var timer = pr.timerStart({type: 'db', op: 'select'}, {some: 'data'});
setTimeout(function () {
  pr.timerStop(timer);

  console.log('With one stopped timer.');
  console.log(pr.getInfo());

  pr.flush(function (err) {
    if (err) throw err;
  });

  console.log('Flushed.');
}, 333);
