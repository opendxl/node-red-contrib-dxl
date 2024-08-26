/**
 * @module DxlService
 * @description Implementation of the `dxl-core-service` node
 * @private
 */

'use strict'

const MessageUtils = require('../lib/message-utils')

module.exports = function (RED) {
  /**
   * @classdesc Node which registers a service with the DXL fabric. When a
   * request message is received by the service, a corresponding new message is
   * injected into a flow.
   * @param {Object} nodeConfig - Configuration data which the node uses.
   * @param {String} nodeConfig.serviceType - A textual name for the service.
   *   For example, '/mycompany/myservice'.
   * @param {Array<Object>} [nodeConfig.rules=[]] - A list of objects containing
   *   a topic that the service handles requests for and a payloadType which
   *   describes the type of the request payload.
   * @param {String} [nodeConfig.rules[].payloadType=txt] - Controls the data
   *   type for the msg.payload property in the new message injected into a
   *   flow. If payloadType is 'bin', the raw binary Buffer received in the DXL
   *   request payload is forwarded along. If payloadType is 'txt', the binary
   *   Buffer is decoded from UTF-8 octets into a String. If payloadType is
   *   'obj', the binary Buffer is decoded into a UTF-8 string and parsed as
   *   JSON text into an Object. If an error occurs when attempting to convert
   *   the binary Buffer of the payload into the desired data type, the current
   *   flow is halted with an error.
   * @param {String} nodeConfig.rules[].topic - Topic to subscribe to for
   *   request notifications.
   * @param {String} nodeConfig.client - Id of the DXL client configuration node
   *   that this node should be associated with.
   * @constructor
   * @private
   */
  function DxlServiceNode (nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)

    /**
     * A textual name for the service.
     * @type {String}
     * @private
     */
    this._serviceType = nodeConfig.serviceType
    /**
     * A list of objects containing a topic that the service handles requests
     * for and a payloadType which describes the type of the request payload.
     * @type {Array<Object>}
     * @private
     */
    this._rules = nodeConfig.rules || []
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
      if (this._serviceType) {
        let valid = true
        for (let i = 0; i < this._rules.length; i += 1) {
          const rule = this._rules[i]
          if (!rule.topic) {
            this.error('Missing topic name for rule ' + (i + 1))
            valid = false
          }
          if (!rule.payloadType) {
            rule.payloadType = 'txt'
          }
        }

        if (valid) {
          this._client.registerUserNode(this)

          const callbacksByTopic = {}
          this._rules.forEach(function (rule, counter) {
            callbacksByTopic[rule.topic] = function (request) {
              const msg = {
                topic: request.destinationTopic,
                dxlRequest: request,
                dxlMessage: request
              }
              let canConvert = true
              const outputMessages = []
              for (let j = 0; j < node._rules.length; j += 1) {
                if (j === counter) {
                  try {
                    request.payload = MessageUtils.decodePayload(request,
                      node._rules[j].payloadType)
                    msg.payload = request.payload
                    outputMessages.push(msg)
                  } catch (e) {
                    canConvert = false
                    node.error('Error converting request to ' +
                      node._rules[j].payloadType +
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

          const serviceInfo = this._client.registerServiceAsync(this._serviceType,
            callbacksByTopic)
          this.on('close', function (done) {
            node._client.unregisterServiceAsync(serviceInfo)
            node._client.unregisterUserNode(node, done)
          })
          if (this._client.connected) {
            this.status({
              fill: 'green',
              shape: 'dot',
              text: 'node-red:common.status.connected'
            })
          }
        }
      } else if (!this._serviceType) {
        this.error('Missing service type configuration')
      }
    } else {
      this.error('Missing client configuration')
    }
  }

  RED.nodes.registerType('dxl-core-service', DxlServiceNode)
}
