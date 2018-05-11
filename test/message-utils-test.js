'use strict'

require('should')
var Request = require('@opendxl/dxl-client').Request
var MessageUtils = require('..').MessageUtils

describe('MessageUtils', function () {
  context('.decode', function () {
    var testBuffer = Buffer.from(JSON.stringify({test: 'ing'}))
    it('should preserve a buffer for the bin returnType', function () {
      MessageUtils.decode(testBuffer, 'bin').should.eql(testBuffer)
    })
    it('should decode a buffer to a string for the txt returnType', function () {
      MessageUtils.decode(testBuffer, 'txt').should.eql('{"test":"ing"}')
    })
    it('should decode a buffer to an object for the obj returnType', function () {
      MessageUtils.decode(testBuffer, 'obj').should.eql({test: 'ing'})
    })
  })
  context('.decodePayload', function () {
    var testBuffer = Buffer.from(JSON.stringify({test: 'ing'}))
    var request = new Request()
    request.payload = testBuffer
    it('should preserve a message payload for the bin returnType', function () {
      MessageUtils.decodePayload(request, 'bin').should.eql(testBuffer)
    })
    it('should decode a message payload to a string for the txt returnType',
      function () {
        MessageUtils.decodePayload(request, 'txt').should.eql('{"test":"ing"}')
      }
    )
    it('should decode a message payload to an object for the obj returnType',
      function () {
        MessageUtils.decodePayload(request, 'obj').should.eql({test: 'ing'})
      }
    )
  })
  context('.objectToReturnType', function () {
    var testObject = {test: 'ing'}
    it('should preserve an object for the obj returnType', function () {
      MessageUtils.objectToReturnType(testObject, 'obj').should.eql(testObject)
    })
    it('should convert an object to a string for the txt returnType',
      function () {
        MessageUtils.objectToReturnType(testObject, 'txt').should.eql(
          '{"test":"ing"}'
        )
      }
    )
    it('should preserve an object to a buffer for the bin returnType',
      function () {
        MessageUtils.objectToReturnType(testObject, 'bin').should.eql(
          Buffer.from('{"test":"ing"}'))
      }
    )
  })
})
