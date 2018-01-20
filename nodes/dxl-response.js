'use strict'

var dxl = require('@opendxl/dxl-client')
var util = require('../lib/util')

module.exports = function (RED) {
  function DxlResponseNode (config) {
    RED.nodes.createNode(this, config)
    this.client = RED.nodes.getNode(config.client)

    var node = this

    if (this.client) {
      this.status({
        fill: 'red',
        shape: 'ring',
        text: 'node-red:common.status.disconnected'
      })
      this.client.register(this)
      this.on('input', function (msg) {
        if (msg.hasOwnProperty('payload') &&
          msg.hasOwnProperty('dxlRequest')) {
          var response
          if (msg.hasOwnProperty('error') &&
            msg.error.hasOwnProperty('message')) {
            var errorMessage = msg.error.message
            var errorCode = 0
            var errorMessageParts = errorMessage.match(/(.*)\((.*)\)/)
            if (errorMessageParts) {
              errorMessage = errorMessageParts[1]
              errorCode = errorMessageParts[2]
            }
            response = new dxl.ErrorResponse(msg.dxlRequest, errorCode,
              errorMessage)
            response.payload = msg.payload
          } else {
            response = new dxl.Response(msg.dxlRequest)
            response.payload = util._convertNonBufferTextToString(msg.payload)
          }
          if (this.client.connected) {
            this.client.sendResponse(response)
          } else {
            this.error('Unable to send response, not connected')
          }
        }
      })
      this.on('close', function (done) {
        node.client.deregister(node, done)
      })
      if (this.client.connected) {
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

  RED.nodes.registerType('dxl-response out', DxlResponseNode)
}
