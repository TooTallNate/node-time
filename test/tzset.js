var should = require('should')
  , time = require('../')

describe('tzset()', function () {

  beforeEach(function () {
    process.env.TZ = 'UTC'
  })

  it('should work with no arguments', function () {
    process.env.TZ = 'US/Pacific'
    time.tzset()
    time.currentTimezone.should.equal('US/Pacific')
  })

  it('should work with 1 argument', function () {
    time.tzset('US/Pacific')
    time.currentTimezone.should.equal('US/Pacific')
  })

  it('should return a "zoneinfo" object', function () {
    var info = time.tzset()
    info.should.have.property('tzname').with.lengthOf(2)
    info.should.have.property('timezone')
    info.should.have.property('daylight')
  })

  it('should set `process.env.TZ`', function () {
    time.tzset('US/Pacific')
    process.env.TZ.should.equal('US/Pacific')
  })

})
