
/**
 * Module depedencies.
 */

var assert = require('assert')
var time = require('../')

describe('exports', function () {

  it('should be a function', function () {
    assert.equal(typeof time, 'function')
  })

  it('should return itself when invoked', function () {
    var dummy = function () {}
    assert.equal(time(dummy), time)
  })

  it('should add node-time extensions to the passed in function\'s prototype',
  function () {
    var dummy = function () {}
    var proto = dummy.prototype

    assert.notEqual('function', typeof proto.setTimezone);
    assert.notEqual('function', typeof proto.getTimezone);
    assert.notEqual('function', typeof proto.getTimezoneAbbr);
    time(dummy)
    assert.equal('function', typeof proto.setTimezone);
    assert.equal('function', typeof proto.getTimezone);
    assert.equal('function', typeof proto.getTimezoneAbbr);
  })

  it('should throw if in invalid object is passed into it', function () {
    assert.throws(time)
  })

  it('should have a "currentTimezone" property', function () {
    assert.equal('string', typeof time.currentTimezone);
    assert(time.currentTimezone)
  })

  describe('localtime()', function () {

    // GH-40
    it('should not segfault on a NaN Date value', function () {
      var invalid = new Date(NaN)
      var local = time.localtime(invalid.getTime())
      assert.deepEqual({ invalid: true }, local)
    })

  })

  describe('Date', function () {

    it('should have a "Date" property', function () {
      assert.equal('function', typeof time.Date);
    })

    it('should *not* be the global "Date" object', function () {
      assert.notStrictEqual(time.Date, Date);
    })

    it('should return a real "Date" instance', function () {
      var d = new time.Date()
      assert.equal(Object.prototype.toString.call(d), '[object Date]')
    })

    it('should pass `time.Date` instanceof', function () {
      var d = new time.Date()
      assert(d instanceof time.Date)
    })

    it('should not pass global instanceof', function () {
      var d = new time.Date()
      assert.equal(d instanceof Date, false)
    })

    it('should already have the node-time extensions', function () {
      assert.equal('function', typeof time.Date.prototype.setTimezone)
      assert.equal('function', typeof time.Date.prototype.getTimezone)
      assert.equal('function', typeof time.Date.prototype.getTimezoneAbbr)
    })

    it('should have all the regular Date properties', function () {
      assert.equal('function', typeof time.Date.now)
      assert.equal('function', typeof time.Date.parse)
      assert.equal('function', typeof time.Date.UTC)
    })

  })

})
