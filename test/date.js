var should = require('should')
  , time = require('../')

describe('Date', function () {

  describe('constructor', function() {

      it('should parse strings relative to TZ', function() {

          var d = new time.Date('2012-1-12 02:00 PM', 'America/New_York')
          d.getTime().should.equal(1326394800000);
          d.getTimezone().should.equal('America/New_York');

          d = new time.Date('2012-1-12 02:00 PM', 'America/Los_Angeles')
          d.getTime().should.equal(1326405600000);
          d.getTimezone().should.equal('America/Los_Angeles');
      })

      it('should interpret date parts relative to TZ', function() {

          var d = new time.Date(2012, 0, 12, 14, 'America/New_York')
          d.getTime().should.equal(1326394800000);
          d.getTimezone().should.equal('America/New_York');

          var d = new time.Date(2012, 0, 12, 14, 'America/Los_Angeles')
          d.getTime().should.equal(1326405600000);
          d.getTimezone().should.equal('America/Los_Angeles');
      })

      it('should accept milliseconds regardless of TZ', function() {

          var d1 = new time.Date(1352005200000, 'America/New_York');
          var d2 = new time.Date(1352005200000, 'America/Los_Angeles');

          d1.getTime().should.equal(d2.getTime());
          d1.getTimezone().should.equal('America/New_York');
          d2.getTimezone().should.equal('America/Los_Angeles');
      })
  })

  describe('#setTimezone()', function () {

    beforeEach(function () {
      time.tzset('UTC')
    })

    it('should clean up after itself', function () {
      var initial = process.env.TZ
        , d = new time.Date
      d.setTimezone('America/Argentina/San_Juan')
      initial.should.equal(process.env.TZ)
    })

    it('should change the "timezone offset"', function () {
      var d = new time.Date
        , offset = d.getTimezoneOffset()
      d.setTimezone('US/Pacific')
      d.getTimezoneOffset().should.not.equal(offset)
    })

    it('should match the UTC values when set to "UTC"', function () {
      var d = new time.Date
      d.setTimezone('UTC')
      d.getUTCDay().should.equal(d.getDay())
      d.getUTCDate().should.equal(d.getDate())
      d.getUTCFullYear().should.equal(d.getFullYear())
      d.getUTCHours().should.equal(d.getHours())
      d.getUTCMilliseconds().should.equal(d.getMilliseconds())
      d.getUTCMinutes().should.equal(d.getMinutes())
      d.getUTCMonth().should.equal(d.getMonth())
      d.getUTCSeconds().should.equal(d.getSeconds())
      d.getTimezoneOffset().should.equal(0)
    })

    it('should especially change the "hours" value', function () {
      var d = new time.Date
        , hours = d.getHours()

      d.setTimezone('US/Pacific')
      d.getHours().should.not.equal(hours)
      hours = d.getHours()

      d.setTimezone('US/Eastern')
      d.getHours().should.not.equal(hours)
      hours = d.getHours()

      d.setTimezone('America/Argentina/San_Juan')
      d.getHours().should.not.equal(hours)
    })


    describe('relative', function () {

      it('should change the timezone', function () {
        var d = new time.Date
        d.setTimezone('US/Pacific', true)
        d.getTimezone().should.not.equal(process.env.TZ)
      })

      it('should keep local values', function () {
        var d = new time.Date
          , millis = d.getMilliseconds()
          , seconds = d.getSeconds()
          , minutes = d.getMinutes()
          , hours = d.getHours()
          , date = d.getDate()
          , month = d.getMonth()
          , year = d.getFullYear()

        d.setTimezone('US/Pacific', true)

        d.getMilliseconds().should.equal(millis)
        d.getSeconds().should.equal(seconds)
        d.getMinutes().should.equal(minutes)
        d.getHours().should.equal(hours)
        d.getDate().should.equal(date)
        d.getMonth().should.equal(month)
        d.getFullYear().should.equal(year)
      })

      it('should change the date\'s internal time value', function () {
        var d = new time.Date
          , old = d.getTime()
        d.setTimezone('US/Pacific', true)
        d.getTime().should.not.equal(old)
      })

    })

  })
})
