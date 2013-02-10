/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

var PinbaRequest = exports.PinbaRequest = function (params) {
  // Requests params: hostname, script and server
  this.params = params;
  
  // Timers
  this.timerIdGenerator = 0;
  this.timers = {};
};

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

PinbaRequest.prototype.timerStop = function (timer) {
  if (timer in this.timers) {
    if (this.timers[timer].started) {
      this.timers[timer].started = false;
      this.timers[timer].value = process.hrtime(this.timers[timer].value);
    } else {
      throw new Error("Pinba: Cannot stop already stopped timer");
    }
  } else {
    throw new Error("Pinba: Cannot stop nonexistent timer");
  }
};

PinbaRequest.prototype.timerDelete = function (timer) {
  if (timer in this.timers) {
    delete this.timers[timer];
  } else {
    throw new Error("Pinba: Cannot delete nonexistent timer");
  }
};

PinbaRequest.prototype.timerTagsMerge = function (timer, tags) {
  if (timer in this.timers) {
    this.timers[timer].tags = merge(this.timers[timer].tags, tags);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

PinbaRequest.prototype.timerTagsReplace = function (timer, tags) {
  if (timer in this.timers) {
    this.timers[timer].tags = tags;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

PinbaRequest.prototype.timerDataMerge = function (timer, data) {
  if (timer in this.timers) {
    this.timers[timer].data = merge(this.timers[timer].data, data);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

PinbaRequest.prototype.timerDataReplace = function (timer, data) {
  if (timer in this.timers) {
    this.timers[timer].data = data;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

PinbaRequest.prototype.timerGetInfo = function (timer) {
  if (timer in this.timers) {
    timer = this.timers[timer];
    if (timer.started) {
      timer.value = process.hrtime(timer.value);
    }
    return timer;
  } else {
    throw new Error("Pinba: Cannot get info for nonexistent timer");
  }
};

PinbaRequest.prototype.timersStop = function () {
  for (timer in this.timers) {
    if (this.timers.hasOwnProperty(timer)) {
      if (this.timers[timer].started) {
        this.timers[timer].started = false;
        this.timers[timer].value = process.hrtime(this.timers[timer].value);
      }
    }
  }
};

PinbaRequest.prototype.getInfo = function (timer) {
  throw new Error("Pinba: Not yet implemented");
};

PinbaRequest.prototype.scriptNameSet = function (script_name) {
  throw new Error("Pinba: Not yet implemented");
};

PinbaRequest.prototype.hostNameSet = function (host_name) {
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
