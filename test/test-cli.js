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

pr.tagSet('tag1', 'value');
pr.tagSet('tag2', 'value');

console.log('Started.');
console.log(pr.getInfo());

var timer1 = pr.timerStart({tag1: 'value-value'}, {some1: 'data'});
var timer2 = pr.timerStart({tag2: 'value-value'}, {some2: 'data'});

var timer3 = pr.timerStart({type: 'db', op: 'select'}, {some3: 'data'});
setTimeout(function () {
  pr.timerStop(timer3);

  console.log('With one stopped timer.');
  console.log(pr.getInfo());

  pr.flush(function (err) {
    if (err) throw err;
  });

  console.log('Flushed.');
}, 333);
