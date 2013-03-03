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

var SimpleGPB = require('./simple-gpb.js');

var pinbaProto = {
  1:  ["hostname", SimpleGPB.TYPE_STRING],
  2:  ["server_name", SimpleGPB.TYPE_STRING],
  3:  ["script_name", SimpleGPB.TYPE_STRING],
  4:  ["request_count", SimpleGPB.TYPE_UINT32],
  5:  ["document_size", SimpleGPB.TYPE_UINT32],
  6:  ["memory_peak", SimpleGPB.TYPE_UINT32],
  7:  ["request_time", SimpleGPB.TYPE_UINT32],
  8:  ["ru_utime", SimpleGPB.TYPE_UINT32],
  9:  ["ru_stime", SimpleGPB.TYPE_UINT32],
  10: ["timer_hit_count", SimpleGPB.TYPE_UINT32, SimpleGPB.ELEMENT_REPEATED],
  11: ["timer_value", SimpleGPB.TYPE_UINT32, SimpleGPB.ELEMENT_REPEATED],
  12: ["timer_tag_count", SimpleGPB.TYPE_UINT32, SimpleGPB.ELEMENT_REPEATED],
  13: ["timer_tag_name", SimpleGPB.TYPE_UINT32, SimpleGPB.ELEMENT_REPEATED],
  14: ["timer_tag_value", SimpleGPB.TYPE_UINT32, SimpleGPB.ELEMENT_REPEATED],
  15: ["dictionary", SimpleGPB.TYPE_STRING, SimpleGPB.ELEMENT_REPEATED],
  16: ["status", SimpleGPB.TYPE_UINT32, SimpleGPB.ELEMENT_OPTIONAL]
};

/**
 * class PinbaRequest
 *
 * Main module class. Used to declare "requests" in Pinba terminology.
 * Contains common request data and associated timers.
 **/

/**
 * new PinbaRequest(properties)
 * - properties (Object): Request properties.
 *
 * PinbaRequest constructor.
 **/
var PinbaRequest = exports.PinbaRequest = function (properties) {
  // Guard that properties in object
  properties = properties || {};

  // Request properties: hostname, server_name and script_name
  this.hostname = osHostname;
  this.server_name = '';
  this.script_name = '';
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
  if ('pinba_server' in properties) {
    this.pinba_server = properties.pinba_server;
  }
  if ('pinba_port' in properties) {
    this.pinba_port = properties.pinba_port;
  }

  // Request start time
  this.start = process.hrtime();
  
  // Request timers
  this.timerIdGenerator = 0;
  this.timers = {};
};

/**
 * PinbaRequest#setHostname(hostname)
 * - hostname (String): Hostname.
 *
 * Setter for *hostname* request property.
 * Default value: OS hostname
 **/
PinbaRequest.prototype.setHostname = function (hostname) {
  this.hostname = hostname;
};

/**
 * PinbaRequest#setServerName(server_name)
 * - server_name (String): Server name.
 *
 * Setter for *server_name* request property.
 * Default value: empty.
 **/
PinbaRequest.prototype.setServerName = function (server_name) {
  this.server_name = server_name;
};

/**
 * PinbaRequest#setScriptName(script_name)
 * - script_name (String): Script name.
 *
 * Setter for *script_name* request property.
 * Default value: empty.
 **/
PinbaRequest.prototype.setScriptName = function (script_name) {
  this.script_name = script_name;
};

/**
 * PinbaRequest#setPinbaServer(pinba_server)
 * - pinba_server (String): Pinba server hostname or IP address.
 *
 * Setter for *pinba_server* property.
 * Default value: '127.0.0.1'.
 **/
PinbaRequest.prototype.setPinbaServer = function (pinba_server) {
  this.pinba_server = pinba_server;
};

/**
 * PinbaRequest#setPinbaPort(pinba_port)
 * - pinba_port (String): Pinba server port.
 *
 * Setter for *pinba_port* property.
 * Default value: 30002.
 **/
PinbaRequest.prototype.setPinbaPort = function (pinba_port) {
  this.pinba_port = pinba_port;
};

/**
 * PinbaRequest#timerStart(tags[, data]) -> Integer
 * - tags (Object): Hash of tags and their values. Cannot contain numeric indexes for obvious reasons.
 * - data (Object): Optional hash with user data, not sent to the server.
 *
 * Creates and starts new timer.
 **/
PinbaRequest.prototype.timerStart = function (tags, data) {
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
 * PinbaRequest#timerStop(timer)
 * - timer (Integer): Valid timer id.
 *
 * Stops the timer.
 **/
PinbaRequest.prototype.timerStop = function (timer) {
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
 * PinbaRequest#timerAdd(tags, value[, data]) -> Integer
 * - tags (Object): Hash of tags and their values. Cannot contain numeric indexes for obvious reasons.
 * - value (Number): Time value for new timer.
 * - data (Object): Optional hash with user data, not sent to the server.
 *
 * Creates new timer. This timer is already stopped and have specified time value.
 **/
PinbaRequest.prototype.timerAdd = function (tags, value, data) {
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
 * PinbaRequest#timerDelete(timer)
 * - timer (Integer): Valid timer id.
 *
 * Deletes the timer.
 **/
PinbaRequest.prototype.timerDelete = function (timer) {
  if (timer in this.timers) {
    delete this.timers[timer];
  } else {
    throw new Error("Pinba: Cannot delete nonexistent timer");
  }
};

/**
 * PinbaRequest#timerTagsMerge(timer, tags)
 * - timer (Integer): Valid timer id.
 * - tags (Object): Hash of tags and their values.
 *
 * Merges tags with the timer tags replacing existing elements.
 **/
PinbaRequest.prototype.timerTagsMerge = function (timer, tags) {
  if (timer in this.timers) {
    this.timers[timer].tags = _.merge(this.timers[timer].tags, tags);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * PinbaRequest#timerTagsReplace(timer, tags)
 * - timer (Integer): Valid timer id.
 * - tags (Object): Hash of tags and their values.
 *
 * Replaces timer tags with the passed tags.
 **/
PinbaRequest.prototype.timerTagsReplace = function (timer, tags) {
  if (timer in this.timers) {
    this.timers[timer].tags = tags;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * PinbaRequest#timerDataMerge(timer, data)
 * - timer (Integer): Valid timer id.
 * - data (Object): Hash with user data.
 *
 * Merges data with the timer data replacing existing elements.
 **/
PinbaRequest.prototype.timerDataMerge = function (timer, data) {
  if (timer in this.timers) {
    this.timers[timer].data = _.merge(this.timers[timer].data, data);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * PinbaRequest#timerDataReplace(timer, data)
 * - timer (Integer): Valid timer id.
 * - data (Object): Hash with user data.
 *
 * Replaces timer data with the passed data.
 **/
PinbaRequest.prototype.timerDataReplace = function (timer, data) {
  if (timer in this.timers) {
    this.timers[timer].data = data;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * PinbaRequest#timerGetInfo(timer)
 * - timer (Integer): Valid timer id.
 *
 * Returns timer data.
 **/
PinbaRequest.prototype.timerGetInfo = function (timer) {
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
 * PinbaRequest#timersStop()
 *
 * Stops all running timers.
 **/
PinbaRequest.prototype.timersStop = function () {
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
 * PinbaRequest#getInfo()
 *
 * Returns all request data (including timers user data).
 **/
PinbaRequest.prototype.getInfo = function () {
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
    timers:         []
  };

  // Timers info
  _.forOwn(this.timers, function (timer, timer_id) {
    info.timers.push(this.timerGetInfo(timer_id));
  }, this);

  return info;
};

PinbaRequest.prototype.getPacketInfo = function () {
  throw new Error("Pinba: Not yet implemented");
};

/**
 * PinbaRequest#flush([callback])
 * - callback (Function): Optional callback.
 *
 * Should be called on request end to send request data to Pinba server.
 * Also useful when you need to send request data to the server immediately (for long running CLI scripts).
 **/
PinbaRequest.prototype.flush = function (callback) {
  var data = this.getPacketInfo();

  // As in PHP Pinba Extension?
  // TODO: Streaming
  var buffer = new Buffer(256);

  var length = SimpleGPB.encode(buffer, 0/*offset*/, data, pinbaProto);

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
