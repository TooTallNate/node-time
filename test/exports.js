var should = require('should')
  , time = require('../')

describe('exports', function () {

  it('should be a function', function () {
    time.should.be.a('function')
  })

  it('should return itself when invoked', function () {
    var dummy = function () {}
    time(dummy).should.equal(time)
  })

  it('should add node-time extensions to the passed in function\'s prototype'
  , function () {
    var dummy = function () {}
      , proto = dummy.prototype

    proto.should.not.have.property('setTimezone')
    proto.should.not.have.property('getTimezone')
    proto.should.not.have.property('getTimezoneAbbr')
    time(dummy)
    proto.should.have.property('setTimezone')
    proto.should.have.property('getTimezone')
    proto.should.have.property('getTimezoneAbbr')

  })

  it('should throw if in invalid object is passed into it', function () {
    should.throws(time)
  })

  it('should have a "currentTimezone" property', function () {
    time.should.have.property('currentTimezone')
    time.currentTimezone.should.not.be.empty
  })

})
