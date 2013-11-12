
/**
 * Module dependencies.
 */

var assert = require('assert')
var time = require('../')

describe('tzset()', function () {

  beforeEach(function () {
    process.env.TZ = 'UTC'
  })

  it('should work with no arguments', function () {
    process.env.TZ = 'US/Pacific'
    time.tzset()
    assert.equal(time.currentTimezone, 'US/Pacific')
  })

  it('should work with 1 argument', function () {
    time.tzset('US/Pacific')
    assert.equal(time.currentTimezone, 'US/Pacific')
  })

  it('should return a "zoneinfo" object', function () {
    var info = time.tzset()
    assert('tzname' in info)
    assert(info.tzname.length, 2)
    assert('timezone' in info)
    assert('daylight' in info)
  })

  it('should set `process.env.TZ`', function () {
    time.tzset('US/Pacific')
    assert.equal(process.env.TZ, 'US/Pacific')
  })

  it('should work with known values', function () {
    var info

    info = time.tzset('UTC')
    assert.equal(info.tzname[0], 'UTC')
    assert.equal(info.timezone, 0)
    assert.equal(info.daylight, 0)

    info = time.tzset('America/Los_Angeles')
    assert.equal(info.tzname[0], 'PST')
    assert.equal(info.tzname[1], 'PDT')
    assert.notEqual(info.timezone, 0)

    info = time.tzset('America/Phoenix')
    assert.equal(info.tzname[0], 'MST')
    assert.equal(info.tzname[1], 'MDT')
    assert.notEqual(info.timezone, 0)

    info = time.tzset('Europe/Copenhagen')
    assert.equal(info.tzname[0], 'CET')
    assert.equal(info.tzname[1], 'CEST')
    assert.notEqual(info.timezone, 0)
  })

})
