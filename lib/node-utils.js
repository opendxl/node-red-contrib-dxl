/**
 * @module NodeUtils
 */

'use strict'

module.exports = {
  /**
   * Convert the supplied value into a number.
   * @param value - The value to convert.
   * @param defaultValue - If the value parameter is undefined, null,
   *   a zero-length string, or a string containing only whitespace characters,
   *   the defaultValue is returned.
   * @returns The converted or default value. If the value parameter is
   *   non-null, not a zero-length string, and not a string containing only
   *   whitespace characters but cannot be converted to a number, NaN is
   *   returned.
   * @private
   */
  valueToNumber: function (value, defaultValue) {
    if (module.exports.isEmpty(value)) {
      value = defaultValue
    } else if (typeof value === 'string') {
      value = value.trim().toLowerCase()
      switch (value) {
        case 'false':
          value = 0
          break
        case 'true':
          value = 1
          break
        default:
          value = Number(value)
      }
    } else if (typeof value === 'boolean') {
      value = Number(value)
    } else if (isNaN(value)) {
      value = NaN
    }
    return value
  },
  /**
   * Return a default value if the supplied value is "empty" -- undefined, null,
   * a zero-length string, or a string containing only whitespace characters.
   * @param value - The value to check
   * @param defaultValue - The value to return if the value is "empty".
   * @returns Supplied value or defaultValue.
   */
  defaultIfEmpty: function (value, defaultValue) {
    return module.exports.isEmpty(value) ? defaultValue : value
  },
  /**
   * Return whether the supplied value is empty.
   * @param {String} value - The value.
   * @returns {boolean} true if the value is undefined, null, a zero-length
   *   string, or a string containing only whitespace characters. Otherwise,
   *   false.
   */
  isEmpty: function (value) {
    return (value === undefined || value === null ||
      ((typeof value === 'string') && !value.trim()))
  }
}
