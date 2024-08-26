/**
 * @module DxlEventOut
 * @description Implementation of the `dxl-core-event out` node
 * @private
 */

'use strict'

const dxl = require('@opendxl/dxl-client')
const NodeUtils = require('..').NodeUtils

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
   * @private
   */
  function DxlEventOutNode (nodeConfig) {
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
        const topic = NodeUtils.defaultIfEmpty(nodeConfig.topic, msg.dxlTopic)
        if (topic) {
          const event = new dxl.Event(topic)
          event.payload = msg.payload
          if (this._client.connected) {
            this._client.sendEvent(event)
          } else {
            this.error('Unable to send event, not connected')
          }
        } else {
          this.error('Unable to send event, no topic available')
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

  RED.nodes.registerType('dxl-core-event out', DxlEventOutNode)
}
