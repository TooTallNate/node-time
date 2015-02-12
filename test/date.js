
/**
 * Module dependencies.
 */

var assert = require('assert')
var time = require('../')

describe('Date', function () {

  describe('constructor', function() {

    it('should parse strings relative to TZ', function() {

      var d = new time.Date('2012-1-12 02:00 PM', 'America/New_York')
      assert.equal(d.getTime(), 1326394800000)
      assert.equal(d.getTimezone(), 'America/New_York')

      d = new time.Date('2012-1-12 02:00 PM', 'America/Los_Angeles')
      assert.equal(d.getTime(), 1326405600000)
      assert.equal(d.getTimezone(), 'America/Los_Angeles')
    })

    it('should interpret date parts relative to TZ', function() {

      var d = new time.Date(2012, 0, 12, 14, 'America/New_York')
      assert.equal(d.getTime(), 1326394800000)
      assert.equal(d.getFullYear(), 2012)
      assert.equal(d.getTimezone(), 'America/New_York')

      d = new time.Date(2012, 0, 12, 14, 'America/Los_Angeles')
      assert.equal(d.getTime(), 1326405600000)
      assert.equal(d.getTimezone(), 'America/Los_Angeles')
    })

    it('should accept milliseconds regardless of TZ', function() {

      var d1 = new time.Date(1352005200000, 'America/New_York')
      var d2 = new time.Date(1352005200000, 'America/Los_Angeles')

      assert.equal(d1.getTime(), d2.getTime())
      assert.equal(d1.getTimezone(), 'America/New_York')
      assert.equal(d2.getTimezone(), 'America/Los_Angeles')
    })


    it('should parse strings around 2038', function() {

      // Before threshold
      var d = new time.Date('2037-12-31 11:59:59 PM', 'UTC')
      assert.equal(d.getTime(), 2145916799000)

      // After threshold
      d = new time.Date('2038-01-01 00:00:00 AM', 'UTC')
      assert.equal(d.getTime(), 2145916800000)

      // Before threshold
      d = new time.Date('2038-1-19 03:14:06 AM', 'UTC')
      assert.equal(d.getTime(), 2147483646000)

      // After threshold
      d = new time.Date('2038-1-19 03:14:07 AM', 'UTC')
      assert.equal(d.getTime(), 2147483647000)
    })
  })

  it('should accept js1.3 extended set* arguments', function() {

    var d = new time.Date(2000, 1, 2, 3, 4, 5, 6, 'America/Chicago')
    d.setFullYear(2001, 2, 3)
    assert.equal(d.getTime(), 983610245006)
    d.setFullYear(2002, 3)
    assert.equal(d.getTime(), 1017824645006)
    d.setMonth(4, 5)
    assert.equal(d.getTime(), 1020585845006)
    d.setHours(4, 5, 6, 7)
    assert.equal(d.getTime(), 1020589506007)
    d.setHours(5, 6, 7)
    assert.equal(d.getTime(), 1020593167007)
    d.setHours(6, 7)
    assert.equal(d.getTime(), 1020596827007)
    d.setMinutes(8, 9, 10)
    assert.equal(d.getTime(), 1020596889010)
    d.setMinutes(9, 10)
    assert.equal(d.getTime(), 1020596950010)
    d.setSeconds(11, 12)
    assert.equal(d.getTime(), 1020596951012)
  })

  it('should accept js1.3 extended setUTC* arguments', function() {

    var d = new time.Date(2000, 1, 2, 3, 4, 5, 6, 'America/Chicago')
    d.setUTCFullYear(2001, 2, 3)
    assert.equal(d.getTime(), 983610245006)
    d.setUTCFullYear(2002, 3)
    assert.equal(d.getTime(), 1017824645006)
    d.setUTCMonth(4, 5)
    assert.equal(d.getTime(), 1020589445006)
    d.setUTCHours(4, 5, 6, 7)
    assert.equal(d.getTime(), 1020571506007)
    d.setUTCHours(5, 6, 7)
    assert.equal(d.getTime(), 1020575167007)
    d.setUTCHours(6, 7)
    assert.equal(d.getTime(), 1020578827007)
    d.setUTCMinutes(8, 9, 10)
    assert.equal(d.getTime(), 1020578889010)
    d.setUTCMinutes(9, 10)
    assert.equal(d.getTime(), 1020578950010)
    d.setUTCSeconds(11, 12)
    assert.equal(d.getTime(), 1020578951012)
  })

  describe('#setTimezone()', function () {

    beforeEach(function () {
      time.tzset('UTC')
    })

    it('should clean up after itself', function () {
      var initial = process.env.TZ
        , d = new time.Date()
      d.setTimezone('America/Argentina/San_Juan')
      assert.equal(initial, process.env.TZ)
    })

    it('should be chainable', function () {
      var initial = process.env.TZ
        , d = new time.Date().setTimezone('America/Argentina/San_Juan')
      assert.equal(d.getTimezone(), 'America/Argentina/San_Juan')
    })

    it('should change the "timezone offset"', function () {
      var d = new time.Date()
        , offset = d.getTimezoneOffset()
      d.setTimezone('US/Pacific')
      assert.notEqual(d.getTimezoneOffset(), offset)
    })

    it('should match the UTC values when set to "UTC"', function () {
      var d = new time.Date()
      d.setTimezone('UTC')
      assert.equal(d.getUTCDay(), d.getDay())
      assert.equal(d.getUTCDate(), d.getDate())
      assert.equal(d.getUTCFullYear(), d.getFullYear())
      assert.equal(d.getUTCHours(), d.getHours())
      assert.equal(d.getUTCMilliseconds(), d.getMilliseconds())
      assert.equal(d.getUTCMinutes(), d.getMinutes())
      assert.equal(d.getUTCMonth(), d.getMonth())
      assert.equal(d.getUTCSeconds(), d.getSeconds())
      assert.equal(d.getTimezoneOffset(), 0)
    })

    it('should especially change the "hours" value', function () {
      var d = new time.Date()
        , hours = d.getHours()

      d.setTimezone('US/Pacific')
      assert.notEqual(d.getHours(), hours)
      hours = d.getHours()

      d.setTimezone('US/Eastern')
      assert.notEqual(d.getHours(), hours)
      hours = d.getHours()

      d.setTimezone('America/Argentina/San_Juan')
      assert.notEqual(d.getHours(), hours)
    })


    describe('relative', function () {

      it('should change the timezone', function () {
        var d = new time.Date()
        d.setTimezone('US/Pacific', true)
        assert.notEqual(d.getTimezone(), process.env.TZ)
      })

      it('should keep local values', function () {
        var d = new time.Date()
          , millis = d.getMilliseconds()
          , seconds = d.getSeconds()
          , minutes = d.getMinutes()
          , hours = d.getHours()
          , date = d.getDate()
          , month = d.getMonth()
          , year = d.getFullYear()
        d.setTimezone('US/Pacific', true)

        assert.equal( d.getMilliseconds(), millis)
        assert.equal(d.getSeconds(), seconds)
        assert.equal(d.getMinutes(), minutes)
        assert.equal(d.getHours(), hours)
        assert.equal(d.getDate(), date)
        assert.equal(d.getMonth(), month)
        assert.equal(d.getFullYear(), year)
      })

      it('should change the date\'s internal time value', function () {
        var d = new time.Date()
          , old = d.getTime()
        d.setTimezone('US/Pacific', true)
        assert.notEqual(d.getTime(), old)
      })

      it('should calculate correctly when UTC date is day after timezone date', function () {
        var forwards = {
            timezone: 'US/Pacific', hour: 22, minute: 47,
            year: 2013, month: 1, date: 31
        }
        var d = new time.Date(
          forwards.year, forwards.month - 1, forwards.date,
          forwards.hour, forwards.minute, 1, 1, forwards.timezone
        )
        assert.equal(d.toString(), 'Thu Jan 31 2013 22:47:01 GMT-0800 (PST)')
        d.setTimezone('UTC')
        assert.equal(d.toString(), 'Fri Feb 01 2013 06:47:01 GMT+0000 (UTC)')
      })

      it('should calculate correctly when UTC date is day before timezone date', function () {
        var d = new time.Date(2010, 0, 31, 19, 0, 0, 0, 'UTC')
        assert.equal(d.toString(), 'Sun Jan 31 2010 19:00:00 GMT+0000 (UTC)')

        var backwards = {
          timezone: 'Australia/Sydney', hour: 2, minute: 47,
          year: 2013, month: 2, date: 1
        }

        var d2 = new time.Date(
          backwards.year, backwards.month - 1, backwards.date,
          backwards.hour, backwards.minute, 1, 1, backwards.timezone
        )
        assert.equal(d2.toString(), 'Fri Feb 01 2013 02:47:01 GMT+1100 (AEDT)')
        d2.setTimezone('UTC')
        assert.equal(d2.toString(), 'Thu Jan 31 2013 15:47:01 GMT+0000 (UTC)')
      })

      it('should calculate correctly on edge of months', function() {
        var d = new time.Date("2013-02-01 01:02:03", 'US/Pacific')
        assert.equal(d.toString(), 'Fri Feb 01 2013 01:02:03 GMT-0800 (PST)')
        d.setTimezone('UTC')
        assert.equal(d.toString(), 'Fri Feb 01 2013 09:02:03 GMT+0000 (UTC)')
      })

      it('should produce the right time string for half-hour time offsets', function() {
        var d = new time.Date("2014-01-17T13:14:15-0330")
        d.setTimezone('America/St_Johns')
        assert.equal(d.toString(), 'Fri Jan 17 2014 13:14:15 GMT-0330 (NST)')
        d.setTimezone('UTC')
        assert.equal(d.toString(), 'Fri Jan 17 2014 16:44:15 GMT+0000 (UTC)')
      })

    })

  })
})
