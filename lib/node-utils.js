/**
 * @module NodeUtils
 */

'use strict'

module.exports = {
  /**
   * Convert the supplied value into a number.
   * @param value - The value to convert.
   * @param {Number} defaultValue - If the value parameter is undefined, return
   *   the value for this parameter.
   * @returns {Number} The converted value.
   * @private
   */
  valueToNumber: function (value, defaultValue) {
    if (typeof value === 'undefined') {
      value = defaultValue
    } else if (typeof value === 'string') {
      value = Number(value)
    }
    return value
  }
}
