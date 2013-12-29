/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

var _ = require('lodash');

var osHostname = require('os').hostname();

var GPB = require('gpb');

var pinbaRequestMessageProto = {
  1:  ["hostname", GPB.STRING],
  2:  ["server_name", GPB.STRING],
  3:  ["script_name", GPB.STRING],
  4:  ["request_count", GPB.UINT32],
  5:  ["document_size", GPB.UINT32],
  6:  ["memory_peak", GPB.UINT32],
  7:  ["request_time", GPB.UINT32],
  8:  ["ru_utime", GPB.UINT32],
  9:  ["ru_stime", GPB.UINT32],
  10: ["timer_hit_count", GPB.UINT32, GPB.REPEATED],
  11: ["timer_value", GPB.UINT32, GPB.REPEATED],
  12: ["timer_tag_count", GPB.UINT32, GPB.REPEATED],
  13: ["timer_tag_name", GPB.UINT32, GPB.REPEATED],
  14: ["timer_tag_value", GPB.UINT32, GPB.REPEATED],
  15: ["dictionary", GPB.STRING, GPB.REPEATED],
  16: ["status", GPB.UINT32, GPB.OPTIONAL],
  17: ["memory_footprint", GPB.UINT32, GPB.OPTIONAL],
  // 18 - Request
  19: ["memory_footprint", GPB.STRING, GPB.OPTIONAL],
  20: ["tag_name", GPB.STRING, GPB.REPEATED],
  21: ["tag_value", GPB.STRING, GPB.REPEATED]
};

/**
 * class Request
 *
 * Main module class. Used to declare "requests" in Pinba terminology.
 * Contains common request data and associated timers.
 **/

/**
 * new Request(properties)
 * - properties (Object): Request properties.
 *
 * Request constructor.
 **/
var Request = exports.Request = function (properties) {
  // Guard that properties in object
  properties = properties || {};

  // Request properties: hostname, server_name and script_name
  this.hostname = osHostname;
  this.server_name = '';
  this.script_name = '';
  this.schema = '';
  this.pinba_server = '127.0.0.1';
  this.pinba_port = 30002;
  if ('hostname' in properties) {
    this.hostname = properties.hostname;
  }
  if ('server_name' in properties) {
    this.server_name = properties.server_name;
  }
  if ('script_name' in properties) {
    this.script_name = properties.script_name;
  }
  if ('schema' in properties) {
    this.schema = properties.schema;
  }
  if ('pinba_server' in properties) {
    this.pinba_server = properties.pinba_server;
  }
  if ('pinba_port' in properties) {
    this.pinba_port = properties.pinba_port;
  }

  // Request start time
  this.start = process.hrtime();

  // Request tags
  this.tags = {};

  // Request timers
  this.timerIdGenerator = 0;
  this.timers = {};
};

/**
 * Request#setHostname(hostname)
 * - hostname (String): Hostname.
 *
 * Setter for *hostname* request property.
 * Default value: OS hostname
 **/
Request.prototype.setHostname = function (hostname) {
  this.hostname = hostname;
};

/**
 * Request#setServerName(server_name)
 * - server_name (String): Server name.
 *
 * Setter for *server_name* request property.
 * Default value: empty.
 **/
Request.prototype.setServerName = function (server_name) {
  this.server_name = server_name;
};

/**
 * Request#setScriptName(script_name)
 * - script_name (String): Script name.
 *
 * Setter for *script_name* request property.
 * Default value: empty.
 **/
Request.prototype.setScriptName = function (script_name) {
  this.script_name = script_name;
};

/**
 * Request#setSchema(schema)
 * - schema (String): Script name.
 *
 * Setter for *schema* request property.
 * Default value: empty.
 **/
Request.prototype.setSchema = function (schema) {
  this.schema = schema;
};

/**
 * Request#setPinbaServer(pinba_server)
 * - pinba_server (String): Pinba server hostname or IP address.
 *
 * Setter for *pinba_server* property.
 * Default value: '127.0.0.1'.
 **/
Request.prototype.setPinbaServer = function (pinba_server) {
  this.pinba_server = pinba_server;
};

/**
 * Request#setPinbaPort(pinba_port)
 * - pinba_port (String): Pinba server port.
 *
 * Setter for *pinba_port* property.
 * Default value: 30002.
 **/
Request.prototype.setPinbaPort = function (pinba_port) {
  this.pinba_port = pinba_port;
};

/**
 * Request#tagSet(tag, value)
 * - tag (String): Tag name.
 * - value (String): Tag value.
 *
 * Set or update request tag value.
 **/
Request.prototype.tagSet = function (tag, value) {
  this.tags[tag] = value;
};

/**
 * Request#tagGet(tag)
 * - tag (String): Tag name.
 *
 * Get request tag value.
 **/
Request.prototype.tagGet = function (tag) {
  return this.tags[tag];
};

/**
 * Request#tagDelete(tag)
 * - tag (String): Tag name.
 *
 * Delete request tag value.
 **/
Request.prototype.tagDelete = function (tag) {
  delete this.tags[tag];
};

/**
 * Request#tagsGet()
 *
 * Get request tags with values.
 **/
Request.prototype.tagsGet = function () {
  return this.tags;
};

/**
 * Request#timerStart(tags[, data]) -> Integer
 * - tags (Object): Hash of tags and their values. Cannot contain numeric indexes for obvious reasons.
 * - data (Object): Optional hash with user data, not sent to the server.
 *
 * Creates and starts new timer.
 **/
Request.prototype.timerStart = function (tags, data) {
  var time = process.hrtime();
  var timer = (++this.timerIdGenerator);
  this.timers[timer] = {
    value: time,
    started: true,
    tags: tags,
    data: data
  };
  return timer;
};

/**
 * Request#timerStop(timer)
 * - timer (Integer): Valid timer id.
 *
 * Stops the timer.
 **/
Request.prototype.timerStop = function (timer) {
  if (timer in this.timers) {
    if (this.timers[timer].started) {
      this.timers[timer].started = false;
      this.timers[timer].value = process.hrtime(this.timers[timer].value);
      this.timers[timer].value = this.timers[timer].value[0] + this.timers[timer].value[1] / 1e9;
    } else {
      throw new Error("Pinba: Cannot stop already stopped timer");
    }
  } else {
    throw new Error("Pinba: Cannot stop nonexistent timer");
  }
};

/**
 * Request#timerAdd(tags, value[, data]) -> Integer
 * - tags (Object): Hash of tags and their values. Cannot contain numeric indexes for obvious reasons.
 * - value (Number): Time value for new timer.
 * - data (Object): Optional hash with user data, not sent to the server.
 *
 * Creates new timer. This timer is already stopped and have specified time value.
 **/
Request.prototype.timerAdd = function (tags, value, data) {
  var timer = (++this.timerIdGenerator);
  this.timers[timer] = {
    value: value,
    started: false,
    tags: tags,
    data: data
  };
  return timer;
};

/**
 * Request#timerDelete(timer)
 * - timer (Integer): Valid timer id.
 *
 * Deletes the timer.
 **/
Request.prototype.timerDelete = function (timer) {
  if (timer in this.timers) {
    delete this.timers[timer];
  } else {
    throw new Error("Pinba: Cannot delete nonexistent timer");
  }
};

/**
 * Request#timerTagsMerge(timer, tags)
 * - timer (Integer): Valid timer id.
 * - tags (Object): Hash of tags and their values.
 *
 * Merges tags with the timer tags replacing existing elements.
 **/
Request.prototype.timerTagsMerge = function (timer, tags) {
  if (timer in this.timers) {
    this.timers[timer].tags = _.merge(this.timers[timer].tags, tags);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerTagsReplace(timer, tags)
 * - timer (Integer): Valid timer id.
 * - tags (Object): Hash of tags and their values.
 *
 * Replaces timer tags with the passed tags.
 **/
Request.prototype.timerTagsReplace = function (timer, tags) {
  if (timer in this.timers) {
    this.timers[timer].tags = tags;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerDataMerge(timer, data)
 * - timer (Integer): Valid timer id.
 * - data (Object): Hash with user data.
 *
 * Merges data with the timer data replacing existing elements.
 **/
Request.prototype.timerDataMerge = function (timer, data) {
  if (timer in this.timers) {
    this.timers[timer].data = _.merge(this.timers[timer].data, data);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerDataReplace(timer, data)
 * - timer (Integer): Valid timer id.
 * - data (Object): Hash with user data.
 *
 * Replaces timer data with the passed data.
 **/
Request.prototype.timerDataReplace = function (timer, data) {
  if (timer in this.timers) {
    this.timers[timer].data = data;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerGetInfo(timer)
 * - timer (Integer): Valid timer id.
 *
 * Returns timer data.
 **/
Request.prototype.timerGetInfo = function (timer) {
  if (timer in this.timers) {
    timer = _.clone(this.timers[timer]);
    if (timer.started) {
      timer.value = process.hrtime(timer.value);
      timer.value = timer.value[0] + timer.value[1] / 1e9;
    }
    return timer;
  } else {
    throw new Error("Pinba: Cannot get info for nonexistent timer");
  }
};

/**
 * Request#timersStop()
 *
 * Stops all running timers.
 **/
Request.prototype.timersStop = function () {
  _.forOwn(this.timers, function (timer, timer_id) {
    if (timer.started) {
      timer.started = false;
      timer.value = process.hrtime(timer.value);
      timer.value = timer.value[0] + timer.value[1] / 1e9;

      this.timers[timer_id] = timer;
    }
  }, this);
};

/**
 * Request#getInfo()
 *
 * Returns all request data (including timers user data).
 **/
Request.prototype.getInfo = function () {
  // Request time
  var req_time = process.hrtime(this.start);
  req_time = req_time[0] + req_time[1] / 1e9;

  // Memory usage
  var memory_usage = process.memoryUsage(); // We have not more exact information

  // Request info
  var info = {
    mem_peak_usage: memory_usage.rss, // We have not more exact information
    req_time:       req_time,
    ru_utime:       0, // We have no exact information
    ru_stime:       0, // We have no exact information
    req_count:      1,
    doc_size:       0, // We have no exact information
    server_name:    this.server_name,
    script_name:    this.script_name,
    schema:         this.schema,
    timers:         [],
    tags:           this.tags
  };

  // Timers info
  _.forOwn(this.timers, function (timer, timer_id) {
    info.timers.push(this.timerGetInfo(timer_id));
  }, this);

  return info;
};

Request.prototype.getPacketInfo = function () {
  throw new Error("Pinba: Not yet implemented");
};

/**
 * Request#flush([callback])
 * - callback (Function): Optional callback.
 *
 * Should be called on request end to send request data to Pinba server.
 * Also useful when you need to send request data to the server immediately (for long running CLI scripts).
 **/
Request.prototype.flush = function (callback) {
  var data = this.getPacketInfo();

  var encoded_length = GPB.encoded_length(data, pinbaRequestMessageProto);
  var buffer = new Buffer(encoded_length);

  var length = GPB.encode(buffer, 0/*offset*/, data, pinbaRequestMessageProto);
  if (length != encoded_length) {
    if (typeof callback === 'function') {
      var err = new Exception("Wrong encoded message size");
      process.nextTick(function () {
        callback(err);
      });
    }
    return;
  }

  var socket = require('dgram').createSocket('udp4');
  socket.send(buffer, 0, length, this.pinba_port, this.pinba_server, function (err, bytes) {
    socket.close();

    if (typeof callback === 'function') {
      process.nextTick(function () {
        callback(err);
      });
    }
  });
};
