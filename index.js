var bindings = require('./time');

exports.time = bindings.time;
exports.tzset = bindings.tzset;
exports.localtime = bindings.localtime;

var DateProto = global.Date.prototype;

// The "setTimeZone" function is the "entry point" for a Date instance.
// It must be called after an instance has been created. After, the 'getSeconds()',
// 'getHours()', 'getDays()', etc. functions will return values relative
// to the time zone specified.
function setTimeZone(timezone) {
  this._timezone = timezone;
  if (!('_getEpochSeconds' in this)) extend(this, extensions);
  var origTz = process.env.TZ;
  process.env.TZ = timezone;
  bindings.tzset();
  this._zoneInfo = bindings.localtime(this._getEpochSeconds());
  process.env.TZ = origTz;
  bindings.tzset();  
  return this._zoneInfo;
}
DateProto.setTimeZone = setTimeZone;


// Returns a "String" of the last value set in "setTimeZone".
function getTimeZone() {
  return this._timezone;
}
DateProto.getTimeZone = getTimeZone;




// These props gets monkey-patched onto a Date instance after the first time
// the 'setTimeZone()' function is called on that instance.
var extensions = {

  // Like 'getTime', but returns seconds instead of milliseconds
  _getEpochSeconds: function getEpochSeconds() {
    return Math.floor(this.getTime() / 1000);
  },

  // 
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
  //

  // Returns the day of the month (1-31) for the specified date according to local time.
  getDate: function getDate() {
    return '_zoneInfo' in this ?
      this._zoneInfo.dayOfMonth :
      DateProto.getDate.call(this);
  },

  // Returns the day of the week (0-6) for the specified date according to local time.
  getDay: function getDay() {
    return '_zoneInfo' in this ?
      this._zoneInfo.dayOfWeek :
      DateProto.getDay.call(this);
  },

  // Deprecated. Returns the year (usually 2-3 digits) in the specified date according
  // to local time. Use `getFullYear()` instead.
  getYear: function getYear() {
    return '_zoneInfo' in this ?
      this._zoneInfo.year:
      DateProto.getYear.call(this);
  },

  // Returns the year (4 digits for 4-digit years) of the specified date according to local time.
  getFullYear: function getFullYear() {
    return '_zoneInfo' in this ?
      this._zoneInfo.year + 1900:
      DateProto.getFullYear.call(this);
  },

  // Returns the hour (0-23) in the specified date according to local time.
  getHours: function getHours() {
    return '_zoneInfo' in this ?
      this._zoneInfo.hours:
      DateProto.getHours.call(this);
  },

  // Returns the minutes (0-59) in the specified date according to local time.
  getMinutes: function getMinutes() {
    return '_zoneInfo' in this ?
      this._zoneInfo.minutes:
      DateProto.getMinutes.call(this);
  },

  // Returns the month (0-11) in the specified date according to local time.
  getMonth: function getMonth() {
    return '_zoneInfo' in this ?
      this._zoneInfo.month:
      DateProto.getMonth.call(this);
  },

  // Returns the seconds (0-59) in the specified date according to local time.
  getSeconds: function getSeconds() {
    return '_zoneInfo' in this ?
      this._zoneInfo.seconds:
      DateProto.getSeconds.call(this);
  }
}


function extend(dest, source) {
  for (var prop in source) {
    dest[prop] = source[prop];
  }
}
