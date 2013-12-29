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
  pinba_server: 'cpp1.d3',
  schema:       'http',
  server_name:  'node.pinba',
  script_name:  '/handler'
});

console.log('Started.');
console.log(pr.getInfo());

var timer = pr.timerStart({type: 'db', op: 'select'}, {some: 'data'});
setTimeout(function () {
  pr.timerStop(timer);

  console.log('With one stopped timer.');
  console.log(pr.getInfo());

  pr.flush();

  console.log('Flushed.');
}, 333);
