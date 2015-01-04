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
  7:  ["request_time", GPB.FLOAT],
  8:  ["ru_utime", GPB.FLOAT],
  9:  ["ru_stime", GPB.FLOAT],
  10: ["timer_hit_count", GPB.UINT32, GPB.REPEATED],
  11: ["timer_value", GPB.FLOAT, GPB.REPEATED],
  12: ["timer_tag_count", GPB.UINT32, GPB.REPEATED],
  13: ["timer_tag_name", GPB.UINT32, GPB.REPEATED],
  14: ["timer_tag_value", GPB.UINT32, GPB.REPEATED],
  15: ["dictionary", GPB.STRING, GPB.REPEATED],
  16: ["status", GPB.UINT32, GPB.OPTIONAL],
  17: ["memory_footprint", GPB.UINT32, GPB.OPTIONAL],
  // 18 - Request
  19: ["schema", GPB.STRING, GPB.OPTIONAL],
  20: ["tag_name", GPB.UINT32, GPB.REPEATED],
  21: ["tag_value", GPB.UINT32, GPB.REPEATED]
};

exports.FLUSH_ONLY_STOPPED_TIMERS = (1 << 0);
exports.FLUSH_RESET_DATA          = (1 << 1);

exports.ONLY_STOPPED_TIMERS = exports.FLUSH_ONLY_STOPPED_TIMERS;

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
  this.server_name = 'unknown';
  this.script_name = 'unknown';
  this.schema = 'unknown';
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
 * Default value: 'unknown'.
 **/
Request.prototype.setServerName = function (server_name) {
  this.server_name = server_name;
};

/**
 * Request#setScriptName(script_name)
 * - script_name (String): Script name.
 *
 * Setter for *script_name* request property.
 * Default value: 'unknown'.
 **/
Request.prototype.setScriptName = function (script_name) {
  this.script_name = script_name;
};

/**
 * Request#setSchema(schema)
 * - schema (String): Script name.
 *
 * Setter for *schema* request property.
 * Default value: 'unknown'.
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
  var timer_id = (++this.timerIdGenerator);
  this.timers[timer_id] = {
    value: time,
    started: true,
    tags: tags,
    data: data
  };
  return timer_id;
};

/**
 * Request#timerStop(timer_id)
 * - timer_id (Integer): Valid timer id.
 *
 * Stops the timer.
 **/
Request.prototype.timerStop = function (timer_id) {
  if (timer_id in this.timers) {
    if (this.timers[timer_id].started) {
      this.timers[timer_id].started = false;
      this.timers[timer_id].value = process.hrtime(this.timers[timer_id].value);
      this.timers[timer_id].value = this.timers[timer_id].value[0] + this.timers[timer_id].value[1] / 1e9;
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
  var timer_id = (++this.timerIdGenerator);
  this.timers[timer_id] = {
    value: value,
    started: false,
    tags: tags,
    data: data
  };
  return timer_id;
};

/**
 * Request#timerDelete(timer_id)
 * - timer_id (Integer): Valid timer id.
 *
 * Deletes the timer.
 **/
Request.prototype.timerDelete = function (timer_id) {
  if (timer_id in this.timers) {
    delete this.timers[timer_id];
  } else {
    throw new Error("Pinba: Cannot delete nonexistent timer");
  }
};

/**
 * Request#timerTagsMerge(timer_id, tags)
 * - timer_id (Integer): Valid timer id.
 * - tags (Object): Hash of tags and their values.
 *
 * Merges tags with the timer tags replacing existing elements.
 **/
Request.prototype.timerTagsMerge = function (timer_id, tags) {
  if (timer_id in this.timers) {
    this.timers[timer_id].tags = _.merge(this.timers[timer_id].tags, tags);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerTagsReplace(timer_id, tags)
 * - timer_id (Integer): Valid timer id.
 * - tags (Object): Hash of tags and their values.
 *
 * Replaces timer tags with the passed tags.
 **/
Request.prototype.timerTagsReplace = function (timer_id, tags) {
  if (timer_id in this.timers) {
    this.timers[timer_id].tags = tags;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerDataMerge(timer_id, data)
 * - timer_id (Integer): Valid timer id.
 * - data (Object): Hash with user data.
 *
 * Merges data with the timer data replacing existing elements.
 **/
Request.prototype.timerDataMerge = function (timer_id, data) {
  if (timer_id in this.timers) {
    this.timers[timer_id].data = _.merge(this.timers[timer_id].data, data);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerDataReplace(timer_id, data)
 * - timer_id (Integer): Valid timer id.
 * - data (Object): Hash with user data.
 *
 * Replaces timer data with the passed data.
 **/
Request.prototype.timerDataReplace = function (timer_id, data) {
  if (timer_id in this.timers) {
    this.timers[timer_id].data = data;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

/**
 * Request#timerGetInfo(timer_id)
 * - timer_id (Integer): Valid timer id.
 *
 * Returns timer data.
 **/
Request.prototype.timerGetInfo = function (timer_id) {
  if (timer_id in this.timers) {
    var timer = _.clone(this.timers[timer_id]);
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
 * Request#timersGet(flag)
 * - flag (Integer): Timers filter flag.
 *
 * Get timers. If flag == ONLY_STOPPED_TIMERS returns only stopped timers.
 **/
Request.prototype.timersGet = function (flag) {
  var timers = [];

  _.forOwn(this.timers, function (timer, timer_id) {
    if ((flag === exports.ONLY_STOPPED_TIMERS) && timer.started) {
      return;
    }

    timers.push(timer_id);
  }, this);

  return timers;
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

  // Request info
  var info = {
    hostname:       this.hostname,
    server_name:    this.server_name,
    script_name:    this.script_name,
    schema:         this.schema,

    req_count:      1,
    req_time:       req_time,
    ru_utime:       0, // We have no exact information
    ru_stime:       0, // We have no exact information

    timers:         [],
    tags:           _.clone(this.tags)
  };

  // Timers info
  _.forOwn(this.timers, function (timer, timer_id) {
    info.timers.push(this.timerGetInfo(timer_id));
  }, this);

  return info;
};

Request.prototype.getGPBMessageData = function () {
  // Request time
  var req_time = process.hrtime(this.start);
  req_time = req_time[0] + req_time[1] / 1e9;

  var data = {
    hostname:          this.hostname,
    server_name:       this.server_name,
    script_name:       this.script_name,
    schema:            this.schema,

    request_count:    1,
    request_time:     req_time,

    memory_peak:      0, // We have no exact information

    document_size:    0, // We have no exact information
    status:           0, // We have no exact information

    ru_utime:         0, // We have no exact information
    ru_stime:         0, // We have no exact information

    tag_name:         [],
    tag_value:        [],

    timer_hit_count:  [],
    timer_value:      [],
    timer_tag_count:  [],
    timer_tag_name:   [],
    timer_tag_value:  [],

    dictionary:       []
  };

  var dictionary_flip = {};
  var i;

  // Tags info
  _.forOwn(this.tags, function (tag_value, tag_name) {
    // Tag name
    if (tag_name in dictionary_flip) {
      i = dictionary_flip[tag_name];
    } else {
      i = data.dictionary.push(tag_name) - 1;
      dictionary_flip[tag_name] = i;
    }
    data.tag_name.push(i);

    // Tag value
    if (tag_value in dictionary_flip) {
      i = dictionary_flip[tag_value];
    } else {
      i = data.dictionary.push(tag_value) - 1;
      dictionary_flip[tag_value] = i;
    }
    data.tag_value.push(i);
  }, this);

  // Timers info
  var timers_unique = {};
  var timer_hash, timer_tags_count = 0;

  _.forOwn(this.timers, function (timer, timer_id) {
    timer_hash = JSON.stringify(timer.tags);

    if (timer_hash in timers_unique) {
      timers_unique[timer_hash].hit_count++;
      timers_unique[timer_hash].value += timer.value;
    } else {
      timers_unique[timer_hash] = {
        hit_count: 1,
        value: timer.value,
        tags: timer.tags
      };
    }
  }, this);

  _.forOwn(timers_unique, function (timer) {
    data.timer_hit_count.push(timer.hit_count);
    data.timer_value.push(timer.value);

    timer_tags_count = 0;

    _.forOwn(timer.tags, function (tag_value, tag_name) {
      timer_tags_count++;

      // Tag name
      if (tag_name in dictionary_flip) {
        i = dictionary_flip[tag_name];
      } else {
        i = data.dictionary.push(tag_name) - 1;
        dictionary_flip[tag_name] = i;
      }
      data.timer_tag_name.push(i);

      // Tag value
      if (tag_value in dictionary_flip) {
        i = dictionary_flip[tag_value];
      } else {
        i = data.dictionary.push(tag_value) - 1;
        dictionary_flip[tag_value] = i;
      }
      data.timer_tag_value.push(i);
    }, this);

    data.timer_tag_count.push(timer_tags_count);
  }, this);

  return data;
};

/**
 * Request#flush([callback])
 * - config (Object): Optional config, contains data to override request ones and flags.
 * - callback (Function): Optional callback.
 *
 * Should be called on request end to send request data to Pinba server.
 * Also useful when you need to send request data to the server immediately (for long running CLI scripts).
 **/
Request.prototype.flush = function (config, callback) {
  // Handle arguments
  if (arguments.length === 1) {
    if (typeof config === 'function') {
      callback = config;
      config = {};
    }
  }

  // TODO: implement
  //var flags = (config && ('flags' in config)) ? config.flags : 0;

  // Stop all running timers
 this.timersStop();

  // TODO: prevent any further access to the timers?

  // Get data for GPB message
  var data = this.getGPBMessageData();

  // Override
  if (config && ('data' in config)) {
    _.forOwn(config.data, function (value, name) {
      data[name] = value;
    });
  }

  var expected_encoded_length = GPB.encoded_length(data, pinbaRequestMessageProto);
  var buffer = new Buffer(expected_encoded_length);

  var actual_encoded_length = GPB.encode(buffer, 0/*offset*/, data, pinbaRequestMessageProto);
  if (actual_encoded_length != expected_encoded_length) {
    var err = new Error("Pinba: Wrong encoded message size");
    if (typeof callback === 'function') {
      process.nextTick(function () {
        callback(err);
      });
      return;
    }
    throw err;
  }

  var socket = require('dgram').createSocket('udp4');
  socket.on('error', function() {/* do nothing */});
  socket.send(buffer, 0, actual_encoded_length, this.pinba_port, this.pinba_server, function (err, bytes) {
    socket.close();

    if (typeof callback === 'function') {
      process.nextTick(function () {
        callback(err);
      });
    }
  });
};
