var bindings = require('./time');

// A "hack" of sorts to Force getting our own Date instance.
// Otherwise, in some cases, the global Natives are shared between
// contexts (not what we want)...
var _Date = process.env.NODE_MODULE_CONTEXTS ? Date : require('vm').runInNewContext("Date");

var MILLIS_PER_SECOND = 1000;
var DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

exports.time = bindings.time;
exports.localtime = bindings.localtime;
exports.mktime = bindings.mktime;

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
  return rtn;
}
exports.tzset = tzset;

// The "setTimezone" function is the "entry point" for a Date instance.
// It must be called after an instance has been created. After, the 'getSeconds()',
// 'getHours()', 'getDays()', etc. functions will return values relative
// to the time zone specified.
function setTimezone(timezone) {
  var oldTz = process.env.TZ;
  var tz = exports.tzset(timezone);
  var zoneInfo = exports.localtime(this / 1000);
  if (oldTz) {
    tzset(oldTz);
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
    return this.setTime(+this + diff);
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
_Date.prototype.setTimezone = _Date.prototype.setTimeZone = setTimezone;


// Returns a "String" of the last value set in "setTimezone".
// TODO: Return something when 'setTimezone' hasn't been called yet.
function getTimezone() {
  throw new Error('You must call "setTimezone(tz)" before "getTimezone()" may be called');
}
_Date.prototype.getTimezone = _Date.prototype.getTimeZone = getTimezone;

// NON-STANDARD: Returns the abbreviated timezone name, also taking daylight
// savings into consideration. Useful for the presentation layer of a Date
// instance.
function getTimezoneAbbr() {
  var str = this.toString().match(/\([A-Z]+\)/)[0];
  return str.substring(1, str.length-1);
}
_Date.prototype.getTimezoneAbbr = getTimezoneAbbr;


// Export the modified 'Date' instance. Users should either use this with the
// 'new' operator, or extend an already existing Date instance with 'extend()'
exports.Date = _Date;

// Turns a "regular" Date instance into one of our "extended" Date instances.
// The return value is negligible, as the original Date instance is modified.
exports.extend = function extend(date) {
  date.getTimezone = getTimezone;
  date.setTimezone = setTimezone;
  date.getTimeZone = getTimezone; // Remove...
  date.setTimeZone = setTimezone; // Remove...
  date.getTimezoneAbbr = getTimezoneAbbr;
  return date;
}


// Pads a number with 0s if required
function pad(num, padLen) {
  var padding = '0000';
  num = String(num);
  return padding.substring(0, padLen - num.length) + num;
}
