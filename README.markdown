Node-pinba
==========

[![NPM version][NPM version image]][NPM version URL] [![Build status][Build status image]][Build status URL]

-----

**[Pinba] module for [node.js].**

Pinba is a MySQL storage engine that acts as a realtime monitoring/statistics server
using MySQL as a read-only interface.
Node-pinba provides client for Pinba server that provides statistics sending from your node.js application.

**This module has been tested with Node.js versions 0.8.26, 0.10.22 and 0.11.9.**

Check out the [Github repo] for the source code.

[Pinba]: http://pinba.org/
[node.js]: http://nodejs.org/

[NPM version image]: https://badge.fury.io/js/pinba.png
[NPM version URL]: http://badge.fury.io/js/pinba
[Build status image]: https://secure.travis-ci.org/Sannis/node-pinba.png?branch=master
[Build status URL]: http://travis-ci.org/Sannis/node-pinba

[Github repo]: https://github.com/Sannis/node-pinba


Installation
------------

You can install this module via [npm]:

    $> npm install pinba

Node.js is not a bottleneck anymore! Now you can use pinba to measure particular code parts
and collect information about requests to your server.

[npm]: https://github.com/isaacs/npm


Usage
-----

Because Node.js operates in single-threaded event loop and does not orient only for HTTP servers,
there was some differences between this module and original Pinba for PHP. Mostly, there is no
isolate requests in Node.js, so you should take care of creating `PinbaRequest` instance
for each code chain that you mention as request and call `PinbaRequest` instance `flush` method at response end.

There is a simple example how to capture timer value around database call during request:

```js
var http = require('http');
var PinbaRequest = require('pinba').PinbaRequest;
var db = require('./my_db.js');

http.createServer(function (req, res) {
  var pr = new PinbaRequest({
    server_name: 'example.com',
    script_name: '/handler'
  });

  var timerDb = pr.timerStart({type: 'db', op: 'select'});
  db.query("SELECT data FROM database", function (err, data) {
    pr.timerStop(timerDb);

    if (err) throw err;

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
    pr.flush();
  });
}).listen(8080, '127.0.0.1');
```

Read this module API docs and original Pinba docs for more information.


Supported features
------------------

There was some difference between original PHP threaded model and Node.js event-loop requests processing.
So not all original Pinba features are supported.

Fully supported:

```
    string hostname
    string server_name
    string script_name
    string schema

    uint32 request_count
    float request_time

    uint32 memory_peak

    string dictionary

    uint32 tag_name
    uint32 tag_value

    uint32 timer_hit_count
    float timer_value
    uint32 timer_tag_count
    uint32 timer_tag_name
    uint32 timer_tag_value
```

TODO:

```
    uint32 document_size
    uint32 memory_footprint

    float ru_utime
    float ru_stime

    uint32 status
```


Contributing
------------

To contribute any patches, simply fork this repository using GitHub
and send a pull request to [me](https://github.com/Sannis). Thanks!


License
-------

MIT license. See license text in file [LICENSE](https://github.com/Sannis/node-pinba/blob/master/LICENSE).


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/Sannis/node-pinba/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

