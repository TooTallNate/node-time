var bindings = require('./time');

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
  tzset(timezone);
  this._timezone = timezone;
  var zoneInfo = bindings.localtime(this / 1000);
  if (oldTz) {
    tzset(oldTz);
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
}
Date.prototype.setTimeZone = DateProto.setTimeZone = setTimeZone;


// Returns a "String" of the last value set in "setTimeZone".
function getTimeZone() {
  return this._timezone;
}
Date.prototype.getTimeZone = DateProto.getTimeZone = getTimeZone;

// Export the modified 'Date' instance in case NODE_MODULE_CONTEXTS is set.
exports.Date = Date;
