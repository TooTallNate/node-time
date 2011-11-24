var fs = require('fs')
  , path = require('path')
  , bindings = require('./time.node')
  , MILLIS_PER_SECOND = 1000
  , DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  , MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  , TZ_BLACKLIST = [ 'SystemV', 'Etc' ];


exports.currentTimezone = process.env.TZ;
exports.time = bindings.time;
exports.localtime = bindings.localtime;
exports.mktime = bindings.mktime;

// A "hack" of sorts to Force getting our own Date instance.
// Otherwise, in some cases, the global Natives are shared between
// contexts (not what we want)...
var _Date = process.env.NODE_MODULE_CONTEXTS ? Date : require('vm').runInNewContext("Date");

// During startup, we synchronously attempt to determine the location of the
// timezone dir, or TZDIR on some systems. This isn't necessary for the
// C bindings, however it's needed for the `listTimezones()` function and for
// resolving the 'initial' timezone to use.
var possibleTzdirs = [
    '/usr/share/zoneinfo'
  , '/usr/lib/zoneinfo'
  , '/usr/share/lib/zoneinfo'
];
var TZDIR = process.env.TZDIR;
while (!TZDIR && possibleTzdirs.length > 0) {
  try {
    var d = possibleTzdirs.shift();
    if (fs.statSync(d).isDirectory())
      TZDIR = d;
  } catch(e) {}
}
possibleTzdirs = null; // garbage collect
if (!TZDIR) throw new Error("FATAL: Couldn't determine the location of your timezone directory!");

// Older versions of node-time would require the user to have the TZ
// environment variable set, otherwise undesirable results would happen. Now
// node-time tries to automatically determine the current timezone for you.
if (!process.env.TZ) {
  try {
    var currentTimezonePath = fs.readlinkSync('/etc/localtime');
    if (currentTimezonePath.substring(0, TZDIR.length) === TZDIR)
      // Got It!
      exports.currentTimezone = process.env.TZ = currentTimezonePath.substring(TZDIR.length + 1);
  } catch(e) {}
}

// The user-facing 'tzset' function accepts a timezone String
// to set to, and returns an object with the zoneinfo for the
// timezone.
function tzset(tz) {
  if (tz) {
    process.env.TZ = tz;
  }
  var usedTz = process.env.TZ;
  var rtn = bindings.tzset();
  if (!rtn.tzname[1] && rtn.timezone === 0) {
    var err = new Error("Unknown Timezone: '" + usedTz + "'");
    for (var i in rtn) {
      err[i] = rtn[i];
    }
    throw err;
  }
  exports.currentTimezone = usedTz;
  return rtn;
}
exports.tzset = tzset;

function listTimezones() {
  if (arguments.length == 0) {
    throw new Error("You must set a callback");
  }
  if (typeof arguments[arguments.length - 1] != "function") {
    throw new Error("You must set a callback");
  }
  var cb = arguments[arguments.length - 1]
    , subset = (arguments.length > 1 ? arguments[0] : null)

  return listTimezonesFolder(subset ? subset + "/" : "", subset ? path.join(TZDIR, "/" + subset) : TZDIR, function (err, tzs) {
    if (err) return cb(err);
    cb(null, tzs.sort());
  });
}
exports.listTimezones = listTimezones;

function listTimezonesFolder(prefix, folder, cb) {
  var timezones = [];

  fs.readdir(folder, function (err, files) {
    if (err) return cb(err);

    var pending_stats = files.length;

    for (var i = 0; i < files.length; i++) {
      if (~TZ_BLACKLIST.indexOf(files[i])
          || files[i].indexOf(".") >= 0
          || files[i][0].toUpperCase() != files[i][0]) {
        pending_stats--;
        continue
      }
      fs.stat(path.join(folder, files[i]), (function (file) {
          return function (err, stats) {
            if (!err) {
              if (stats.isDirectory()) {
                listTimezonesFolder(prefix + file + "/", path.join(folder, file), function (err, tzs) {
                  if (!err) {
                    timezones = timezones.concat(tzs);
                  }
                  pending_stats--;
                  if (pending_stats == 0) cb(null, timezones);
                });
                return;
              }
              if (prefix.length > 0) timezones.push(prefix + file);
            }
            pending_stats--;
            if (pending_stats == 0) cb(null, timezones);
          };
        })(files[i]));
    }
  });
}

// The "setTimezone" function is the "entry point" for a Date instance.
// It must be called after an instance has been created. After, the 'getSeconds()',
// 'getHours()', 'getDays()', etc. functions will return values relative
// to the time zone specified.
function setTimezone(timezone, relative) {

  // If `true` is passed in as the second argument, then the Date instance
  // will have it's timezone set, but it's current local values will remain
  // the same (i.e. the Date's internal time value will be changed)
  var ms, s, m, h, d, mo, y
  if (relative) {
    ms = this.getMilliseconds()
    s  = this.getSeconds()
    m  = this.getMinutes()
    h  = this.getHours()
    d  = this.getDate()
    mo = this.getMonth()
    y  = this.getFullYear()
  }
  var oldTz = exports.currentTimezone;
  var tz = exports.tzset(timezone);
  var zoneInfo = exports.localtime(this.getTime() / 1000);
  if (oldTz != timezone) {
    exports.tzset(oldTz);
    oldTz = null;
  }

  // If we got to here without throwing an Error, then
  // a valid timezone was requested, and we should have
  // a valid zoneInfo Object.
  this.getTimezone = function getTimezone() {
    return timezone;
  }

  // Returns the day of the month (1-31) for the specified date according to local time.
  this.getDate = function getDate() {
    return zoneInfo.dayOfMonth;
  }
  // Returns the day of the week (0-6) for the specified date according to local time.
  this.getDay = function getDay() {
    return zoneInfo.dayOfWeek;
  }
  // Deprecated. Returns the year (usually 2-3 digits) in the specified date according
  // to local time. Use `getFullYear()` instead.
  this.getYear = function getYear() {
    return zoneInfo.year;
  }
  // Returns the year (4 digits for 4-digit years) of the specified date according to local time.
  this.getFullYear = function getFullYear() {
    return zoneInfo.year + 1900;
  }
  // Returns the hour (0-23) in the specified date according to local time.
  this.getHours = function getHours() {
    return zoneInfo.hours;
  }
  // Returns the minutes (0-59) in the specified date according to local time.
  this.getMinutes = function getMinutes() {
    return zoneInfo.minutes;
  }
  // Returns the month (0-11) in the specified date according to local time.
  this.getMonth = function getMonth() {
    return zoneInfo.month;
  }
  // Returns the seconds (0-59) in the specified date according to local time.
  this.getSeconds = function getSeconds() {
    return zoneInfo.seconds;
  }
  // Returns the timezone offset from GMT the Date instance currently is in,
  // in minutes. Also, left of GMT is positive, right of GMT is negative.
  this.getTimezoneOffset = function getTimezoneOffset() {
    return -zoneInfo.gmtOffset / 60;
  }
  // NON-STANDARD: Returns the abbreviation (e.g. EST, EDT) for the specified time zone.
  this.getTimezoneAbbr = function getTimezoneAbbr() {
    return tz.tzname[zoneInfo.isDaylightSavings ? 1 : 0];
  }
  // Sets the day of the month (from 1-31) in the current timezone
  this.setDate = function setDate(v) {
    zoneInfo.dayOfMonth = v;
    return mktime.call(this);
  }
  // Sets the year (four digits) in the current timezone
  this.setFullYear = function setFullYear(v) {
    zoneInfo.year = v - 1900;
    return mktime.call(this);
  }
  // Sets the hour (from 0-23) in the current timezone
  this.setHours = function setHours(v) {
    zoneInfo.hours = v;
    return mktime.call(this);
  }
  // Sets the milliseconds (from 0-999) in the current timezone
  this.setMilliseconds = function setMilliseconds(v) {
    var diff = v - this.getMilliseconds();
    return this.setTime(this.getTime() + diff);
  }
  // Set the minutes (from 0-59) in the current timezone
  this.setMinutes = function setMinutes(v) {
    zoneInfo.minutes = v;
    return mktime.call(this);
  }
  // Sets the month (from 0-11) in the current timezone
  this.setMonth = function setMonth(v) {
    zoneInfo.month = v;
    return mktime.call(this);
  }
  // Sets the seconds (from 0-59) in the current timezone
  this.setSeconds = function setSeconds(v) {
    zoneInfo.seconds = v;
    return mktime.call(this);
  }
  // Sets a date and time by adding or subtracting a specified number of
  // milliseconds to/from midnight January 1, 1970.
  this.setTime = function setTime(v) {
    var rtn = _Date.prototype.setTime.call(this, v);
    // Since this function changes the internal UTC epoch date value, we need to
    // re-setup these timezone translation functions to reflect the new value
    reset.call(this);
    return rtn;
  }
  // Sets the day of the month, according to universal time (from 1-31)
  this.setUTCDate = function setUTCDate(v) {
    var rtn = _Date.prototype.setUTCDate.call(this, v);
    reset.call(this);
    return rtn;
  }
  // Sets the year, according to universal time (four digits)
  this.setUTCFullYear = function setUTCFullYear(v) {
    var rtn = _Date.prototype.setUTCFullYear.call(this, v);
    reset.call(this);
    return rtn;
  }
  // Sets the hour, according to universal time (from 0-23)
  this.setUTCHours = function setUTCHours(v) {
    var rtn = _Date.prototype.setUTCHours.call(this, v);
    reset.call(this);
    return rtn;
  }
  // Sets the milliseconds, according to universal time (from 0-999)
  this.setUTCMilliseconds = function setUTCMillseconds(v) {
    var rtn = _Date.prototype.setUTCMilliseconds.call(this, v);
    reset.call(this);
    return rtn;
  }
  // Set the minutes, according to universal time (from 0-59)
  this.setUTCMinutes = function setUTCMinutes(v) {
    var rtn = _Date.prototype.setUTCMinutes.call(this, v);
    reset.call(this);
    return rtn;
  }
  // Sets the month, according to universal time (from 0-11)
  this.setUTCMonth = function setUTCMonth(v) {
    var rtn = _Date.prototype.setUTCMonth.call(this, v);
    reset.call(this);
    return rtn;
  }
  // Set the seconds, according to universal time (from 0-59)
  this.setUTCSeconds = function setUTCSeconds(v) {
    var rtn = _Date.prototype.setUTCSeconds.call(this, v);
    reset.call(this);
    return rtn;
  }

  this.toDateString = function toDateString() {
    return DAYS_OF_WEEK[this.getDay()].substring(0, 3) + ' ' + MONTHS[this.getMonth()].substring(0, 3) + ' ' + pad(this.getDate(), 2) + ' ' + this.getFullYear();
  }

  this.toTimeString = function toTimeString() {
    var offset = zoneInfo.gmtOffset / 60 / 60;
    return this.toLocaleTimeString() + ' GMT' + (offset >= 0 ? '+' : '-') + pad(Math.abs(offset * 100), 4)
      + ' (' + tz.tzname[zoneInfo.isDaylightSavings ? 1 : 0] + ')';
  }

  this.toString = function toString() {
    return this.toDateString() + ' ' + this.toTimeString();
  }

  this.toLocaleDateString = function toLocaleDateString() {
    return DAYS_OF_WEEK[this.getDay()] + ', ' + MONTHS[this.getMonth()] + ' ' + pad(this.getDate(), 2) + ', ' + this.getFullYear();
  }

  this.toLocaleTimeString = function toLocaleTimeString() {
    return pad(this.getHours(), 2) + ':' + pad(this.getMinutes(), 2) + ':' + pad(this.getSeconds(), 2);
  }

  this.toLocaleString = this.toString;

  if (relative) {
    this.setMilliseconds(ms)
    this.setSeconds(s)
    this.setMinutes(m)
    this.setHours(h)
    this.setDate(d)
    this.setMonth(mo)
    this.setFullYear(y)
    ms, s, m, h, d, mo, y = null
  }


  // Used internally by the 'set*' functions above...
  function reset() {
    this.setTimezone(this.getTimezone());
  }
  // 'mktime' calls 'reset' implicitly through 'setTime()'
  function mktime() {
    var oldTz = process.env.TZ;
    exports.tzset(this.getTimezone());
    zoneInfo.isDaylightSavings = -1; // Auto-detect the timezone
    var t = exports.mktime(zoneInfo);
    if (oldTz) {
      exports.tzset(oldTz);
      oldTz = null;
    }
    return this.setTime( (t * MILLIS_PER_SECOND) + this.getMilliseconds() );
  }

}
_Date.prototype.setTimezone = setTimezone;

// Returns a "String" of the last value set in "setTimezone".
// TODO: Return something when 'setTimezone' hasn't been called yet.
function getTimezone() {
  throw new Error('You must call "setTimezone(tz)" before "getTimezone()" may be called');
}
_Date.prototype.getTimezone = getTimezone;

// NON-STANDARD: Returns the abbreviated timezone name, also taking daylight
// savings into consideration. Useful for the presentation layer of a Date
// instance.
function getTimezoneAbbr() {
  var str = this.toString().match(/\([A-Z]+\)/)[0];
  return str.substring(1, str.length-1);
}
_Date.prototype.getTimezoneAbbr = getTimezoneAbbr;

// Deprecation warnings for timeZone functions
var setTimeZone = deprecated('setTimeZone', setTimezone)
  , getTimeZone = deprecated('getTimeZone', getTimezone)
_Date.prototype.getTimeZone = getTimeZone
_Date.prototype.setTimeZone = setTimeZone

// Export the modified 'Date' instance. Users should either use this with the
// 'new' operator, or extend an already existing Date instance with 'extend()'.
// An optional, NON-STANDARD, "timezone" argument may be appended as the final
// argument, in order to specify the initial timezone the Date instance should
// be created with.
function Date (year, month, day, hour, minute, second, millisecond, timezone) {
  if (!(this instanceof Date)) {
    return new Date(year, month, day, hour, minute, second, millisecond, timezone).toString();
  }
  var argc = arguments.length
    , d;
  // So that we don't have to do the switch block below twice!
  while (argc > 0 && typeof arguments[argc-1] === 'undefined') {
    argc--;
  }
  // An optional 'timezone' argument may be passed as the final argument
  if (argc >= 2 && typeof arguments[argc - 1] === 'string') {
    timezone = arguments[argc - 1];
    argc--;
  }
  // Ugly, but the native Date constructor depends on arguments.length in order
  // to create a Date instance in the intended fashion.
  switch (argc) {
    case 0:
      d = new _Date(); break;
    case 1:
      d = new _Date(year); break;
    case 2:
      d = new _Date(year, month); break;
    case 3:
      d = new _Date(year, month, day); break;
    case 4:
      d = new _Date(year, month, day, hour); break;
    case 5:
      d = new _Date(year, month, day, hour, minute); break;
    case 6:
      d = new _Date(year, month, day, hour, minute, second); break;
    case 7:
      d = new _Date(year, month, day, hour, minute, second, millisecond); break;
  }
  if (timezone) {
    // If a 'timezone' was supplied, then the "trick" is to create another Date
    // instance with the 'setTimezone()' function called on it. After that, we
    // can proxy all the 'set*()' calls to the new Date instance. This is
    // pretty much a "hack", but it allows us to re-use the native Date
    // constructor logic above...
    var realD = new _Date(0);
    realD.setTimezone(timezone);
    realD.setMilliseconds(d.getMilliseconds());
    realD.setSeconds(d.getSeconds());
    realD.setMinutes(d.getMinutes());
    realD.setHours(d.getHours());
    realD.setDate(d.getDate());
    realD.setMonth(d.getMonth());
    realD.setFullYear(d.getFullYear());
    d = realD;
  }
  return d;
}
Date.prototype = _Date.prototype;
exports.Date = Date;


// We also overwrite `Date.parse()`. It can accept an optional 'timezone'
// second argument.
var nativeParse = _Date.parse;
function parse (dateStr, timezone) {
  return new Date(dateStr, timezone).getTime();
}
exports.parse = parse;

// 'now()', 'parse()', and 'UTC()' all need to be re-defined on Date as don't enum
Object.defineProperty(Date, 'now', { value: _Date.now, writable: true, enumerable: false });
Object.defineProperty(Date, 'parse', { value: parse, writable: true, enumerable: false });
Object.defineProperty(Date, 'UTC', { value: _Date.UTC, writable: true, enumerable: false });



// Turns a "regular" Date instance into one of our "extended" Date instances.
// The return value is negligible, as the original Date instance is modified.
exports.extend = function extend (date) {
  if (!date) return date;
  date.getTimezone = getTimezone;
  date.setTimezone = setTimezone;
  date.getTimeZone = getTimeZone; // Remove...
  date.setTimeZone = setTimeZone; // Remove...
  date.getTimezoneAbbr = getTimezoneAbbr;
  return date;
}


// Pads a number with 0s if required
function pad(num, padLen) {
  var padding = '0000';
  num = String(num);
  return padding.substring(0, padLen - num.length) + num;
}

function deprecated (name, func) {
  var warned = false
  return function () {
    if (!warned) {
      console.error(name + "() is deprecated and will be removed in a future version.")
      console.error('Please use ' + func.name + '() instead.')
      warned = true
    }
    return func.apply(this, arguments)
  }
}
