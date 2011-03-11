var bindings = require('./time');

exports.DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
exports.MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
exports.time = bindings.time;
exports.localtime = bindings.localtime;

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

var DateProto = global.Date.prototype;

// The "setTimeZone" function is the "entry point" for a Date instance.
// It must be called after an instance has been created. After, the 'getSeconds()',
// 'getHours()', 'getDays()', etc. functions will return values relative
// to the time zone specified.
function setTimeZone(timezone) {
  var oldTz = process.env.TZ;
  var tz = tzset(timezone);
  var zoneInfo = bindings.localtime(this / 1000);
  this._timezone = timezone;
  if (oldTz) {
    tzset(oldTz);
    oldTz = null;
  }

  // If we got to here without throwing an Error, then
  // a valid timezone was requested, and we should have
  // a valid zoneInfo Object.

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

  this.toDateString = function toDateString() {
    return exports.DAYS_OF_WEEK[this.getDay()].substring(0, 3) + ' ' + exports.MONTHS[this.getMonth()].substring(0, 3) + ' ' + this.getDate() + ' ' + this.getFullYear();
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
    return exports.DAYS_OF_WEEK[this.getDay()] + ', ' + exports.MONTHS[this.getMonth()] + ' ' + this.getDate() + ', ' + this.getFullYear();
  }

  this.toLocaleTimeString = function toLocaleTimeString() {
    return pad(this.getHours(), 2) + ':' + pad(this.getMinutes(), 2) + ':' + pad(this.getSeconds(), 2);
  }

  this.toLocaleString = this.toString;
}
Date.prototype.setTimeZone = DateProto.setTimeZone = setTimeZone;


// Returns a "String" of the last value set in "setTimeZone".
function getTimeZone() {
  return this._timezone;
}
Date.prototype.getTimeZone = DateProto.getTimeZone = getTimeZone;

// Export the modified 'Date' instance in case NODE_MODULE_CONTEXTS is set.
exports.Date = Date;


// Pads a number with 0s if required
function pad(num, padLen) {
  var padding = '0000';
  num = String(num);
  return padding.substring(0, padLen - num.length) + num;
}
