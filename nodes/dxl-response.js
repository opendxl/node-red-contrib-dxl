/**
 * @module DxlResponse
 * @description Implementation of the `dxl-core-response` node
 * @private
 */

'use strict'

const dxl = require('@opendxl/dxl-client')

module.exports = function (RED) {
  /**
   * @classdesc Node which delivers a response message with the msg.payload from
   * the input message to the DXL fabric. This node should typically be
   * downstream in the flow from a DXL service node, which receives the original
   * request from the DXL fabric.
   * @param {Object} nodeConfig - Configuration data which the node uses.
   * @param {String} nodeConfig.client - Id of the DXL client configuration node
   *   that this node should be associated with.
   * @constructor
   * @private
   */
  function DxlResponseNode (nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)

    /**
     * Handle to the DXL client node used to make requests to the DXL fabric.
     * @type {Client}
     * @private
     */
    this._client = RED.nodes.getNode(nodeConfig.client)

    const node = this

    this.status({
      fill: 'red',
      shape: 'ring',
      text: 'node-red:common.status.disconnected'
    })

    if (this._client) {
      this._client.registerUserNode(this)
      this.on('input', function (msg) {
        if (Object.prototype.hasOwnProperty.call(msg, 'dxlRequest')) {
          if (typeof msg.payload === 'undefined') {
            msg.payload = ''
          }
          let response
          if (Object.prototype.hasOwnProperty.call(msg, 'error') &&
              Object.prototype.hasOwnProperty.call(msg.error, 'message')) {
            const errorMessage = msg.error.message
            let errorCode = 0
            if (msg.dxlError && Object.prototype.hasOwnProperty.call(msg.dxlError, 'code')) {
              errorCode = msg.dxlError.code
            }
            response = new dxl.ErrorResponse(msg.dxlRequest, errorCode,
              errorMessage)
            response.payload = msg.payload
          } else {
            response = new dxl.Response(msg.dxlRequest)
            response.payload = msg.payload
          }
          if (this._client.connected) {
            this._client.sendResponse(response)
          } else {
            this.error('Unable to send response, not connected')
          }
        }
      })
      this.on('close', function (done) {
        node._client.unregisterUserNode(node, done)
      })
      if (this._client.connected) {
        this.status({
          fill: 'green',
          shape: 'dot',
          text: 'node-red:common.status.connected'
        })
      }
    } else {
      this.error('Missing client configuration')
    }
  }

  RED.nodes.registerType('dxl-core-response', DxlResponseNode)
}
