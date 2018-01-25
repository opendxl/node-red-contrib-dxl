'use strict'

var dxl = require('@opendxl/dxl-client')
var util = require('../lib/util')

module.exports = function (RED) {
  /**
   * @classdesc Node which delivers an event message with the msg.payload from
   * the input message to the DXL fabric.
   * @param {Object} nodeConfig - Configuration data which the node uses.
   * @param {String} nodeConfig.topic - Topic to publish the event message to.
   *   If the value is empty, the topic will be derived from the input message's
   *   msg.dxlTopic property.
   * @param {String} nodeConfig.client - Id of the DXL client configuration node
   *   that this node should be associated with.
   * @constructor
   */
  function DxlEventOutNode (nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)
    /**
     * Topic to publish the event message to.
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

    if (this._client) {
      this.status({
        fill: 'red',
        shape: 'ring',
        text: 'node-red:common.status.disconnected'
      })
      this._client.registerUserNode(this)
      this.on('input', function (msg) {
        if (msg.hasOwnProperty('payload')) {
          var topic = node._topic || msg.dxlTopic
          if (topic) {
            var event = new dxl.Event(topic)
            event.payload = util._convertNonBufferTextToString(msg.payload)
            if (this._client.connected) {
              this._client.sendEvent(event)
            } else {
              this.error('Unable to send event, not connected')
            }
          } else {
            this.error('Unable to send event, no topic available')
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

  RED.nodes.registerType('dxl-event out', DxlEventOutNode)
}
