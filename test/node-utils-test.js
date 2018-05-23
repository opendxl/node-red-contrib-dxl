'use strict'

require('should')
var NodeUtils = require('..').NodeUtils

describe('NodeUtils', function () {
  context('.valueToNumber', function () {
    it('should convert a numeric string to a number', function () {
      NodeUtils.valueToNumber('42', 'thedefault').should.equal(42)
    })
    it('should convert a boolean to a number', function () {
      NodeUtils.valueToNumber(false, 'thedefault').should.equal(0)
      NodeUtils.valueToNumber('false', 'thedefault').should.equal(0)
      NodeUtils.valueToNumber(' FALSE ', 'thedefault').should.equal(0)
      NodeUtils.valueToNumber(true, 'thedefault').should.equal(1)
      NodeUtils.valueToNumber('true', 'thedefault').should.equal(1)
      NodeUtils.valueToNumber(' TRUE ', 'thedefault').should.equal(1)
    })
    it('should convert a number to itself', function () {
      NodeUtils.valueToNumber(42, 'thedefault').should.equal(42)
    })
    it('should return the default if the value is empty', function () {
      NodeUtils.valueToNumber(null, 'thedefault').should.equal('thedefault')
      NodeUtils.valueToNumber(undefined, 'thedefault').should.equal('thedefault')
      NodeUtils.valueToNumber('', 'thedefault').should.equal('thedefault')
      NodeUtils.valueToNumber('  ', 'thedefault').should.equal('thedefault')
    })
    it('should return NaN if the value cannot be converted', function () {
      NodeUtils.valueToNumber('bogus').should.be.NaN()
      NodeUtils.valueToNumber('42bogus').should.be.NaN()
      NodeUtils.valueToNumber({test: 42}).should.be.NaN()
    })
  })
  context('.defaultIfEmpty', function () {
    it('should return a default value when the supplied value is empty',
      function () {
        NodeUtils.defaultIfEmpty(null, 'thedefault').should.equal('thedefault')
        NodeUtils.defaultIfEmpty(undefined, 'thedefault').should.equal('thedefault')
        NodeUtils.defaultIfEmpty('', 'thedefault').should.equal('thedefault')
        NodeUtils.defaultIfEmpty('  ', 'thedefault').should.equal('thedefault')
      }
    )
    it('should return the supplied value when the supplied value is not empty',
      function () {
        NodeUtils.defaultIfEmpty('test', 'thedefault').should.equal('test')
      }
    )
  })
  context('.isEmpty', function () {
    it('should return true for an undefined variable', function () {
      NodeUtils.isEmpty(undefined).should.be.true()
    })
    it('should return true for an null variable', function () {
      NodeUtils.isEmpty(null).should.be.true()
    })
    it('should return true for a zero-length string', function () {
      NodeUtils.isEmpty('').should.be.true()
    })
    it('should return true for a zero-length string', function () {
      NodeUtils.isEmpty('').should.be.true()
    })
    it('should return false for a number', function () {
      NodeUtils.isEmpty(0).should.be.false()
      NodeUtils.isEmpty(42).should.be.false()
    })
    it('should return false for a string with non-whitespace characters',
      function () {
        NodeUtils.isEmpty(' testing ').should.be.false()
      })
  })
  context('.extractProperty', function () {
    it('should remove a property from an object and return its value',
      function () {
        var obj = {prop1: 'val1', prop2: 'val2', prop3: 'val3'}
        NodeUtils.extractProperty(obj, 'prop2').should.equal('val2')
        obj.should.eql({prop1: 'val1', prop3: 'val3'})
      })
  })
  context('.removeProperties', function () {
    it('should remove properties from an object', function () {
      var obj = {prop1: 'val1', prop2: 'val2', prop3: 'val3'}
      NodeUtils.removeProperties(obj, ['prop1', 'prop3'])
      obj.should.eql({prop2: 'val2'})
    })
  })
})
