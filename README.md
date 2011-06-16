node-time
=========
### "[time.h][]" bindings for [NodeJS][Node].


This module offers simple bindings for the C [time.h][] APIs.
It also offers an extended regular `Date` object with `getTimezone()`
and `setTimezone()` functions, which aren't normally part of JavaScript.


Example
-------

``` javascript
var time = require('time');

// Create a new Date instance
var now = new time.Date();

now.setTimezone("America/Los_Angeles");
// `.getDate()`, `.getDay()`, `.getHours()`, etc.
// will return values according to UTC-8

now.setTimezone("America/New_York");
// `.getDate()`, `.getDay()`, `.getHours()`, etc.
// will return values according to UTC-5
```


API
---


### Date() -> Date

A special `Date` constructor that returns a "super" Date instance, that has
magic _timezone_ capabilities!

``` javascript
var date = new time.Date();
```


#### date.setTimezone(timezone) -> Undefined

Sets the timezone for the `Date` instance. Calls to `getHours()`, `getDays()`,
`getMinutes()`, etc. will be relative to the timezone specified. This will throw
an Error if information for the desired timezone could not be found.

``` javascript
date.setTimezone("America/Argentina/San_Juan");
```


#### date.getTimezone() -> String

Returns a String containing the currently configured timezone for the date instance.
This must be called _after_ `setTimezone()` has been called.

``` javascript
date.getTimezone();
  // "America/Argentina/San_Juan"
```


#### date.getTimezoneAbbr() -> String

Returns the abbreviated timezone name, also taking daylight savings into consideration.
Useful for the presentation layer of a Date instance. This is a _NON-STANDARD_ extension
to the Date object.

``` javascript
date.getTimezoneAbbr();
  // "ART"
```


### extend(date) -> Date

Transforms a "regular" Date instance into one of `node-time`'s "extended" Date instances.

``` javascript
var d = new Date();
// `d.setTimezone()` does not exist...
time.extend(d);
d.setTimezone("UTC");
```


### time() -> Number

Binding for `time()`. Returns the number of seconds since Jan 1, 1900 UTC.
These two are equivalent:

``` javascript
time.time();
  // 1299827226
Math.floor(Date.now() / 1000);
  // 1299827226
```


### tzset(timezone) -> Object

Binding for `tzset()`. Sets up the timezone information that `localtime()` will
use based on the specified _timezone_ variable, or the current `process.env.TZ`
value if none is specified. Returns an Object containing information about the
newly set timezone, or throws an Error if no timezone information could be loaded
for the specified timezone.

``` javascript
time.tzset('US/Pacific');
  // { tzname: [ 'PST', 'PDT' ],
  //   timezone: 28800,
  //   daylight: 1 }
```


### localtime(Number) -> Object

Binding for `localtime()`. Accepts a Number with the number of seconds since the
Epoch (i.e. the result of `time()`), and returns a "broken-down" Object
representation of the timestamp, according the the currently configured timezone
(see `tzset()`).

``` javascript
time.localtime(Date.now()/1000);
  // { seconds: 38,
  //   minutes: 7,
  //   hours: 23,
  //   dayOfMonth: 10,
  //   month: 2,
  //   year: 111,
  //   dayOfWeek: 4,
  //   dayOfYear: 68,
  //   isDaylightSavings: false,
  //   gmtOffset: -28800,
  //   timezone: 'PST' }
```


### currentTimezone -> String

The `currentTimezone` property always contains a String to the current timezone
being used by `node-time`. This property is reset every time the `tzset()`
function is called. Individual `time.Date` instances may have independent
timezone settings than what this one is...


[Node]: http://nodejs.org
[time.h]: http://en.wikipedia.org/wiki/Time.h
