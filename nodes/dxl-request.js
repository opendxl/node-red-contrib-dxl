/**
 * @module DxlRequest
 * @description Implementation of the `dxl-core-request` node
 * @private
 */

'use strict'

const dxl = require('@opendxl/dxl-client')
const MessageUtils = require('../lib/message-utils')
const NodeUtils = require('..').NodeUtils

module.exports = function (RED) {
  /**
   * @classdesc Node which sends a request message containing the msg.payload
   * from the input message to a remote DXL service and writes the response
   * received from the request to the output msg.payload property.
   * @param {Object} nodeConfig - Configuration data which the node uses.
   * @param {String} [nodeConfig.returnType=txt] - Controls the data type for
   *   the msg.payload property in the new message injected into a flow. If
   *   returnType is 'bin', the raw binary Buffer received in the DXL response
   *   payload is forwarded along. If returnType is 'txt', the binary Buffer is
   *   decoded from UTF-8 octets into a String. If returnType is 'obj', the
   *   binary Buffer is decoded into a UTF-8 string and parsed as JSON text into
   *   an Object. If an error occurs when attempting to convert the binary
   *   Buffer of the payload into the desired data type, the current flow is
   *   halted with an error.
   * @param {String} nodeConfig.topic - Topic to send the request to. If the
   *   value is empty, the topic will be derived from the input message's
   *   msg.dxlTopic property.
   * @param {String} nodeConfig.client - Id of the DXL client configuration node
   *   that this node should be associated with.
   * @constructor
   * @private
   */
  function DxlRequestNode (nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)

    /**
     * Controls the data type for the msg.payload property in the new message
     * injected into a flow.
     * @type {String}
     * @private
     */
    this._returnType = nodeConfig.returnType || 'txt'
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
        const topic = NodeUtils.defaultIfEmpty(nodeConfig.topic,
          NodeUtils.extractProperty(msg, 'dxlTopic'))
        if (topic) {
          const request = new dxl.Request(topic)
          request.payload = msg.payload
          if (node._client.connected) {
            this._client.asyncRequest(request,
              function (error, response) {
                if (error) {
                  msg.dxlError = { code: error.code }
                  if (error.dxlErrorResponse) {
                    const responseMessage = error.dxlErrorResponse
                    if (!error.code) {
                      msg.dxlError.code = responseMessage.errorCode
                    }
                    msg.payload = responseMessage.payload
                    msg.dxlResponse = responseMessage
                    msg.dxlMessage = msg.dxlResponse
                  }
                  node.error(error.message, msg)
                } else {
                  msg.dxlResponse = response
                  msg.dxlMessage = msg.dxlResponse
                  delete msg.dxlError
                  try {
                    response.payload = MessageUtils.decodePayload(
                      response, node._returnType)
                    msg.payload = response.payload
                    node.send(msg)
                  } catch (e) {
                    node.error('Error converting response to ' +
                      node._returnType + '. Error: ' + e.message +
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

  RED.nodes.registerType('dxl-core-request', DxlRequestNode)
}
