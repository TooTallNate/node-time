var should = require('should')
  , time = require('../')

describe('tzset()', function () {

  beforeEach(function () {
    time.tzset('UTC')
  })

  it('should work with no arguments', function () {
    process.env.TZ.should.equal('UTC')
    process.env.TZ = 'US/Pacific'
    time.tzset()
    time.currentTimezone.should.equal('US/Pacific')
  })

  it('should work with 1 argument', function () {
    process.env.TZ.should.equal('UTC')
    time.tzset('US/Pacific')
    time.currentTimezone.should.equal('US/Pacific')
  })

  it('should set `process.env.TZ`', function () {
    process.env.TZ.should.equal('UTC')
    time.tzset('US/Pacific')
    process.env.TZ.should.equal('US/Pacific')
  })

})
