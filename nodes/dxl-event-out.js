'use strict'

var dxl = require('@opendxl/dxl-client')
var util = require('../lib/util')

module.exports = function (RED) {
  function DxlEventOutNode (config) {
    RED.nodes.createNode(this, config)
    this.topic = config.topic
    this.client = RED.nodes.getNode(config.client)

    var node = this

    if (this.client) {
      this.status({
        fill: 'red',
        shape: 'ring',
        text: 'node-red:common.status.disconnected'
      })
      this.client.registerUserNode(this)
      this.on('input', function (msg) {
        if (msg.hasOwnProperty('payload')) {
          var topic = node.topic || msg.dxlTopic
          if (topic) {
            var event = new dxl.Event(topic)
            event.payload = util._convertNonBufferTextToString(msg.payload)
            if (this.client.connected) {
              this.client.sendEvent(event)
            } else {
              this.error('Unable to send event, not connected')
            }
          } else {
            this.error('Unable to send event, no topic available')
          }
        }
      })
      this.on('close', function (done) {
        node.client.unregisterUserNode(node, done)
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

  RED.nodes.registerType('dxl-event out', DxlEventOutNode)
}
