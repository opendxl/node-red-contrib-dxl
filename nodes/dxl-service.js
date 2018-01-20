'use strict'

var util = require('../lib/util')

module.exports = function (RED) {
  function DxlServiceNode (config) {
    RED.nodes.createNode(this, config)
    this.serviceType = config.serviceType
    this.rules = config.rules || []
    this.client = RED.nodes.getNode(config.client)

    var node = this

    if (this.client) {
      this.status({
        fill: 'red',
        shape: 'ring',
        text: 'node-red:common.status.disconnected'
      })
      if (this.serviceType) {
        var valid = true
        for (var i = 0; i < this.rules.length; i += 1) {
          var rule = this.rules[i]
          if (!rule.topic) {
            this.error('Missing topic name for rule ' + (i + 1))
            valid = false
          }
          if (!rule.payloadType) {
            rule.payloadType = 'txt'
          }
        }

        if (valid) {
          this.client.register(this)

          var callbacksByTopic = {}
          this.rules.forEach(function (rule, counter) {
            callbacksByTopic[rule.topic] = function (request) {
              var msg = {topic: request.destinationTopic,
                dxlRequest: request,
                dxlMessage: request}
              var canConvert = true
              var outputMessages = []
              for (var j = 0; j < node.rules.length; j += 1) {
                if (j === counter) {
                  try {
                    msg.payload = util._convertBufferToReturnType(
                      node.rules[j].payloadType,
                      request.payload)
                    outputMessages.push(msg)
                  } catch (e) {
                    canConvert = false
                    node.error('Error converting request to ' +
                      node.rules[j].payloadType +
                      '. Error: ' + e.message +
                      ', Payload: ' + request.payload, msg)
                    break
                  }
                } else {
                  outputMessages.push(null)
                }
              }
              if (canConvert) {
                node.send(outputMessages)
              }
            }
          })

          var serviceInfo = this.client.registerService(this.serviceType,
            callbacksByTopic)
          this.on('close', function (done) {
            node.client.unregisterService(serviceInfo)
            node.client.deregister(node, done)
          })
          if (this.client.connected) {
            this.status({
              fill: 'green',
              shape: 'dot',
              text: 'node-red:common.status.connected'
            })
          }
        }
      } else if (!this.serviceType) {
        this.error('Missing service type configuration')
      }
    } else {
      this.error('Missing client configuration')
    }
  }

  RED.nodes.registerType('dxl-service in', DxlServiceNode)
}
