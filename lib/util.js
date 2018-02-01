'use strict'

/**
 * @module Util
 * @private
 */

module.exports = {
  /**
   * Convert the supplied Buffer to the specified returnType. If the
   * returnType is 'bin', the buffer parameter is returned as-is. If the
   * returnType is 'obj', an attempt is made to parse the parameter as JSON
   * after converting it to a UTF-8 string. If the returnType is anything else,
   * e.g., 'txt', an attempt is made to parse the parameter as a UTF-8 string.
   * @param {String} returnType - One of 'bin', 'obj', or 'txt'.
   * @param {Buffer} buffer - The buffer to convert to the desired returnType.
   * @returns {(Buffer|Object|String)} The value converted from the buffer.
   */
  convertBufferToReturnType: function (returnType, buffer) {
    var returnValue = buffer
    if (returnType !== 'bin') {
      returnValue = buffer.toString('utf8')
      if (returnType === 'obj') {
        // The DXL broker may add a trailing null byte to the end of a JSON
        // payload. Strip one off if found before parsing.
        returnValue = JSON.parse(returnValue.replace(/\0$/, ''))
      }
    }
    return returnValue
  }
}
