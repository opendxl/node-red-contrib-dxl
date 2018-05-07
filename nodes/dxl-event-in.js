'use strict'

var util = require('../lib/util')

module.exports = function (RED) {
  /**
   * @classdesc Node which subscribes for event messages to the specific topic
   * on the DXL fabric.
   * @param {Object} nodeConfig - Configuration data which the node uses.
   * @param {String} [nodeConfig.payloadType=txt] - Controls the data type for
   *   the msg.payload property in the new message injected into a flow. If
   *   payloadType is 'bin', the raw binary Buffer received in the DXL event
   *   payload is forwarded along. If payloadType is 'txt', the binary Buffer is
   *   decoded from UTF-8 octets into a String. If payloadType is 'obj', the
   *   binary Buffer is decoded into a UTF-8 string and parsed as JSON text into
   *   an Object. If an error occurs when attempting to convert the binary
   *   Buffer of the payload into the desired data type, the current flow is
   *   halted with an error.
   * @param {String} nodeConfig.topic - Topic to subscribe to for event
   *   notifications.
   * @param {String} nodeConfig.client - Id of the DXL client configuration node
   *   that this node should be associated with.
   * @constructor
   */
  function DxlEventInNode (nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)

    /**
     * Controls the data type for the msg.payload property in the new message
     * injected into a flow.
     * @type {String}
     * @private
     */
    this._payloadType = nodeConfig.payloadType || 'txt'
    /**
     * Topic to subscribe to for event notifications.
     * @type {String}
     * @private
     */
    this._topic = nodeConfig.topic
    /**
     * Handle to the DXL client node used to make requests to the DXL fabric.
     * @type {Client}
     * @private
     */
    this._client = RED.nodes.getNode(nodeConfig.client)

    var node = this

    this.status({
      fill: 'red',
      shape: 'ring',
      text: 'node-red:common.status.disconnected'
    })

    if (this._client) {
      if (this._topic) {
        this._client.registerUserNode(this)
        var eventCallback = function (event) {
          var msg = {topic: event.destinationTopic,
            dxlEvent: event,
            dxlMessage: event}
          try {
            event.payload = util.convertBufferToReturnType(node._payloadType,
              event.payload)
            msg.payload = event.payload
            node.send(msg)
          } catch (e) {
            msg.payload = event.payload
            node.error('Error converting event to ' + node._payloadType +
                '. Error: ' + e.message + ', Payload: ' + event.payload, msg)
          }
        }
        this._client.addEventCallback(this._topic, eventCallback)
        this.on('close', function (done) {
          node._client.removeEventCallback(node._topic, eventCallback)
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
        this.error('Missing topic configuration')
      }
    } else {
      this.error('Missing client configuration')
    }
  }

  RED.nodes.registerType('dxl-core-event in', DxlEventInNode)
}
