/**
 * @module MessageUtils
 * @description DXL messaging related utility methods
 */

/**
 * Base class for the different Data Exchange Layer (DXL) message types.
 * @external Message
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Message.html}
 */

'use strict'

var Buffer = require('safe-buffer').Buffer
var MessageUtils = require('@opendxl/dxl-bootstrap').MessageUtils

module.exports = {
  /**
   * Convert the supplied value to the supplied returnType. If the returnType is
   * 'bin', the value is returned as a binary buffer. If the returnType is
   * 'obj', the value is returned as an object, deserialized from a JSON string.
   * If the returnType is 'txt' (or anything else), the value is returned as a
   * string.
   * @param {(Buffer|String)} value - The value.
   * @param {String} returnType - One of 'bin', 'obj', or 'txt'.
   * @param {String} [encoding=utf8] - The encoding of the value. (Unused
   *   when returnType is 'bin'.)
   * @returns {(Buffer|Object|String)} The value converted from the buffer.
   * @throws {TypeError} If 'bin' is requested but the value is not a binary
   *   buffer.
   */
  decode: function (value, returnType, encoding) {
    var returnValue = value
    if (returnType === 'bin') {
      if (!Buffer.isBuffer(value)) {
        throw new TypeError('Value is not a buffer')
      }
    } else {
      returnValue = MessageUtils.decode(value, encoding)
      if (returnType === 'obj') {
        returnValue = MessageUtils.jsonToObject(returnValue)
      }
    }
    return returnValue
  },
  /**
   * Convert the payload in the supplied DXL message to the supplied
   * payloadType. If the payloadType is 'bin', the payload is returned as a
   * binary buffer. If the payloadType is 'obj', the payload is returned as an
   * object, deserialized from a JSON string. If the payloadType is 'txt' (or
   * anything else), the payload is returned as a string.
   * @param {external:Message} message - The DXL message.
   * @param {String} payloadType - One of 'bin', 'obj', or 'txt'.
   * @param {String} [encoding=utf8] - The encoding of the payload. (Unused
   *   when payloadType is 'bin'.)
   * @returns {(Buffer|Object|String)} The value converted from the buffer.
   * @throws {TypeError} If 'bin' is requested but the payload in the message is
   *   not a binary buffer.
   */
  decodePayload: function (message, payloadType, encoding) {
    return module.exports.decode(message.payload, payloadType, encoding)
  },
  /**
   * Convert an object to a returnType. If the returnType is 'obj', the supplied
   * obj is returned. If the returnType is 'bin', the value is returned as a
   * binary buffer, serialized as a JSON string. If the returnType is 'txt' (or
   * anything else), the value is returned as a JSON-serialized string.
   * @param {Object} obj - The object.
   * @param {String} returnType - One of 'bin', 'obj', or 'txt'.
   * @param {String} [encoding=utf8] - The encoding of the payload. (Unused
   *   unless the payloadType is 'bin'.)
   * @returns {(Buffer|Object|String)} The value converted from the object.
   */
  objectToReturnType: function (obj, returnType, encoding) {
    if (typeof obj !== 'object') {
      throw new TypeError('Value is not an object')
    }
    var returnValue = obj
    if (returnType !== 'obj') {
      returnValue = MessageUtils.objectToJson(obj)
      if (returnType === 'bin') {
        returnValue = MessageUtils.encode(returnValue, encoding)
      }
    }
    return returnValue
  }
}
