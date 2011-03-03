node-time
=========
### "[time.h][]" bindings for [NodeJS][Node].


This module offers simple bindings for the C [time.h][] APIs.
It also extends the regular `Date` object with a `setTimeZone`
function, which isn't normally part of JavaScript.


Example
-------

    var time = require('time');

    // Create a new Date instance
    var now = new Date();

    now.setTimeZone("America/Los_Angeles");
    // `.getDate()`, `.getDay()`, `.getHours()`, etc.
    // will return values according to UTC-8

    now.setTimeZone("America/New_York");
    // `.getDate()`, `.getDay()`, `.getHours()`, etc.
    // will return values according to UTC-5

Be sure to request any additional features by creating a GitHub
Issue requesting it!


API
---

The `time` module itself exports some functions as well:


### time() -> Number

Binding for `time(3)`. Returns the number of seconds since Jan 1, 1900 UTC.


### tzset() -> Undefined

Binding for `tzset(3)`. Sets up the internal timezone information based on the
current `process.env.TZ` value. This must be called after a change to the `TZ`
environment variable.


### localtime(Number) -> Object

Binding for `localtime()`. Accepts a Number with the number of seconds since the
Epoch (i.e. the result of `time()`), and returns a "broken-down" Object
representation of the timestamp, according the the currently configured timezone
(see `tzset()`).


[Node]: http://nodejs.org
[time.h]: http://en.wikipedia.org/wiki/Time.h
