var should = require('should')
  , time = require('../')

describe('Date', function () {
  describe('#setTimezone()', function () {

    beforeEach(function () {
      time.tzset('UTC')
    })

    it('should change the "timezone offset"', function () {
      var d = new time.Date
        , offset = d.getTimezoneOffset()
      d.setTimezone('US/Pacific')
      d.getTimezoneOffset().should.not.equal(offset)
    })

    it('should match the UTC values', function () {
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

  })
})
