'use strict'

var util = require('../lib/util')

module.exports = function (RED) {
  function DxlEventInNode (config) {
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
      if (this.topic) {
        this.client.registerUserNode(this)
        var eventCallback = function (event) {
          var msg = {topic: event.destinationTopic,
            dxlEvent: event,
            dxlMessage: event}
          try {
            msg.payload = util._convertBufferToReturnType(node.ret,
              event.payload)
            node.send(msg)
          } catch (e) {
            msg.payload = event.payload
            node.error('Error converting event to ' + node.ret +
                '. Error: ' + e.message + ', Payload: ' + event.payload, msg)
          }
        }
        this.client.addEventCallback(this.topic, eventCallback)
        this.on('close', function (done) {
          node.client.removeEventCallback(node.topic, eventCallback)
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
        this.error('Missing topic configuration')
      }
    } else {
      this.error('Missing client configuration')
    }
  }

  RED.nodes.registerType('dxl-event in', DxlEventInNode)
}
