/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

// Private data

var timerIdGenerator = 0;
var timers = {};

// Public API

exports.timerStart = function (tags, data) {
  var time = process.hrtime();
  var timer = (++timerIdGenerator);
  timers[timer] = {
    value: time,
    started: true,
    tags: tags,
    data: data
  };
  return timer;
};

exports.timerStop = function (timer) {
  if (timer in timers) {
    if (timers[timer].started) {
      timers[timer].started = false;
      timers[timer].value = process.hrtime(timers[timer].value);
    } else {
      throw new Error("Pinba: Cannot stop already stopped timer");
    }
  } else {
    throw new Error("Pinba: Cannot stop nonexistent timer");
  }
};

exports.timerDelete = function (timer) {
  if (timer in timers) {
    delete timers[timer];
  } else {
    throw new Error("Pinba: Cannot delete nonexistent timer");
  }
};

exports.timerTagsMerge = function (timer, tags) {
  if (timer in timers) {
    timers[timer].tags = merge(timers[timer].tags, tags);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

exports.timerTagsReplace = function (timer, tags) {
  if (timer in timers) {
    timers[timer].tags = tags;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

exports.timerDataMerge = function (timer, data) {
  if (timer in timers) {
    timers[timer].data = merge(timers[timer].data, data);
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

exports.timerDataReplace = function (timer, data) {
  if (timer in timers) {
    timers[timer].data = data;
  } else {
    throw new Error("Pinba: Cannot modify nonexistent timer");
  }
};

exports.timerGetInfo = function (timer) {
  if (timer in timers) {
    timer = timers[timer];
    if (timer.started) {
      timer.value = process.hrtime(timer.value);
    }
    return timer;
  } else {
    throw new Error("Pinba: Cannot get info for nonexistent timer");
  }
};

exports.timersStop = function () {
  for (timer in timers) {
    if (timers.hasOwnProperty(timer)) {
      if (timers[timer].started) {
        timers[timer].started = false;
        timers[timer].value = process.hrtime(timers[timer].value);
      }
    }
  }
};

exports.getInfo = function (timer) {
  throw new Error("Pinba: Not yet implemented");
};

exports.scriptNameSet = function (script_name) {
  throw new Error("Pinba: Not yet implemented");
};

exports.hostNameSet = function (host_name) {
  throw new Error("Pinba: Not yet implemented");
};

exports.flush = function (script_name, flags) {
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
