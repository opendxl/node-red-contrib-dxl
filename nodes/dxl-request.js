'use strict'

var dxl = require('@opendxl/dxl-client')
var util = require('../lib/util')

module.exports = function (RED) {
  function DxlRequestNode (config) {
    RED.nodes.createNode(this, config)
    this.ret = config.ret || 'txt'
    this.topic = config.topic
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
        if (msg.hasOwnProperty('payload')) {
          var topic = node.topic || msg.dxlTopic
          if (topic) {
            var request = new dxl.Request(topic)
            request.payload = util._convertNonBufferTextToString(msg.payload)
            if (node.client.connected) {
              this.client.asyncRequest(request,
                  function (error, response) {
                    if (error) {
                      var errorMessage = error.message
                      if (error instanceof dxl.MessageError) {
                        if (errorMessage) {
                          errorMessage = errorMessage + ' '
                        }
                        errorMessage = errorMessage + '(' + error.code + ')'
                        msg.payload = error.detail.payload
                        msg.dxlResponse = msg.detail
                        msg.dxlMessage = msg.dxlResponse
                      }
                      node.error(errorMessage, msg)
                    } else {
                      msg.dxlResponse = response
                      msg.dxlMessage = msg.dxlResponse
                      try {
                        msg.payload = util._convertBufferToReturnType(node.ret,
                            response.payload)
                        node.send(msg)
                      } catch (e) {
                        node.error('Error converting response to ' + node.ret +
                            '. Error: ' + e.message +
                            ', Payload: ' + response.payload, msg)
                      }
                    }
                  }
              )
            } else {
              this.error('Unable to send request, not connected')
            }
          } else {
            this.error('Unable to send request, no topic available')
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

  RED.nodes.registerType('dxl request', DxlRequestNode)
}
