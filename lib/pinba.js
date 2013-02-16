/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

var osHostname = require('os').hostname();

/**
 * class PinbaRequest
 *
 * Main module class. Used to declare "requests" in Pinba terminology.
 * Contains data about request and associated timers.
 **/

/**
 * new PinbaRequest(properties)
 * - properties (Object): Request properties.
 *
 * PinbaRequest constructor.
 **/
var PinbaRequest = exports.PinbaRequest = function (properties) {
  // Request properties: hostname, server_name and script_name
  this.hostname = osHostname;
  this.server_name = '';
  this.script_name = '';
  if ('hostname' in properties) {
    this.hostname = properties.hostname;
  }
  if ('server_name' in properties) {
    this.server_name = properties.server_name;
  }
  if ('script_name' in properties) {
    this.script_name = properties.script_name;
  }
  
  // Request timers
  this.timerIdGenerator = 0;
  this.timers = {};
};

/**
 * PinbaRequest#setHostname(hostname)
 * - hostname (String): Hostname.
 *
 * Setter for hostname request property
 * Default value: OS hostname
 **/
PinbaRequest.prototype.setHostname = function (hostname) {
  this.hostname = hostname;
};

/**
 * PinbaRequest#setServerName(server_name)
 * - server_name (String): Server name.
 *
 * Setter for server_name request property
 * Default value: empty
 **/
PinbaRequest.prototype.setServerName = function (server_name) {
  this.server_name = server_name;
};

/**
 * PinbaRequest#setScriptName(script_name)
 * - script_name (String): Script name.
 *
 * Setter for script_name request property
 * Default value: empty
 **/
PinbaRequest.prototype.setScriptName = function (script_name) {
  this.script_name = script_name;
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
  throw new Error("Pinba: Not yet implemented");
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
    this.timers[timer].tags = merge(this.timers[timer].tags, tags);
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
    this.timers[timer].data = merge(this.timers[timer].data, data);
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
    timer = this.timers[timer];
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
  for (var timer in this.timers) {
    if (this.timers.hasOwnProperty(timer)) {
      if (this.timers[timer].started) {
        this.timers[timer].started = false;
        this.timers[timer].value = process.hrtime(this.timers[timer].value);
        this.timers[timer].value = this.timers[timer].value[0] + this.timers[timer].value[1] / 1e9;
      }
    }
  }
};

PinbaRequest.prototype.getInfo = function (timer) {
  throw new Error("Pinba: Not yet implemented");
};

PinbaRequest.prototype.flush = function (script_name, flags) {
  throw new Error("Pinba: Not yet implemented");
};

// Private utils

function merge(a, b) {
  var c = a;
  for (k in b) {
    if (b.hasOwnProperty(k)) {
      c[k] = b[k];
    }
  }
  return c;
}
