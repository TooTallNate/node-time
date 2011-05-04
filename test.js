var assert = require('assert');

var initialTz = process.env.TZ = "UTC";

var time = require('./');

var d = new time.Date(Date.UTC(2011, 0, 1));

assert.equal(d.getUTCFullYear(), 2011);
assert.equal(d.getUTCMonth(), 0);
assert.equal(d.getUTCDate(), 1);
console.log(d+'');


d.setTimezone("UTC");
console.log(d+'');
console.log("UTC Hours: " + d.getHours());
assert.equal(d.getUTCDay(), d.getDay());
assert.equal(d.getUTCDate(), d.getDate());
assert.equal(d.getUTCFullYear(), d.getFullYear());
assert.equal(d.getUTCHours(), d.getHours());
assert.equal(d.getUTCMilliseconds(), d.getMilliseconds());
assert.equal(d.getUTCMinutes(), d.getMinutes());
assert.equal(d.getUTCMonth(), d.getMonth());
assert.equal(d.getUTCSeconds(), d.getSeconds());
assert.equal(d.getTimezoneOffset(), 0);


d.setTimezone("America/Los_Angeles");
console.log(d+'');
console.log("LA Hours: " + d.getHours());
assert.equal(d.getHours(), 16);
assert.equal(d.getTimezoneOffset(), 480);


d.setTimezone("America/New_York");
console.log(d+'');
console.log("NY Hours: " + d.getHours());
assert.equal(d.getHours(), 19);


d.setTimezone("US/Arizona");
console.log(d+'');
console.log("AZ Hours: " + d.getHours());
assert.equal(d.getHours(), 17);
assert.equal(d.getUTCHours(), 0);
d.setUTCHours(23);
assert.equal(d.getHours(), 16);
d.setHours(15);
assert.equal(d.getHours(), 15);

// The 'Date' extension functions are meant to "clean up" after themselves
// by setting the TZ variable back to it's original value after doing it's thing.
assert.equal(process.env.TZ, initialTz);
