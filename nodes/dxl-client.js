'use strict'

var dxl = require('@opendxl/dxl-client')

module.exports = function (RED) {
  function convertValueToNumber (value, defaultValue) {
    if (typeof value === 'undefined') {
      value = defaultValue
    } else if (typeof value === 'string') {
      value = Number(value)
    }
    return value
  }

  function DxlClientNode (nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)

    var clientConfig = dxl.Config.createDxlConfigFromFile(nodeConfig.configfile)
    clientConfig.keepAliveInterval = convertValueToNumber(
      nodeConfig.keepalive, 1800)
    clientConfig.reconnectDelay = convertValueToNumber(
      nodeConfig.reconnectdelay, 1)

    this.connected = false

    this._client = new dxl.Client(clientConfig)
    this._connecting = false
    this._closing = false
    this._users = {}

    var node = this

    this._connect = function () {
      if (!node.connected && !node._connecting) {
        node._connecting = true
        node._client.connect()
        node._client.setMaxListeners(0)
        // Register successful connect or reconnect handler
        node._client.on('connect', function () {
          node._connecting = false
          node.connected = true
          for (var id in node._users) {
            if (node._users.hasOwnProperty(id)) {
              node._users[id].status({
                fill: 'green',
                shape: 'dot',
                text: 'node-red:common.status.connected'
              })
            }
          }
        })
        node._client.on('reconnect', function () {
          for (var id in node._users) {
            if (node._users.hasOwnProperty(id)) {
              node._users[id].status({
                fill: 'yellow',
                shape: 'ring',
                text: 'node-red:common.status.connecting'
              })
            }
          }
        })
        // Register disconnect handlers
        node._client.on('close', function () {
          if (node.connected) {
            node.connected = false
            for (var id in node._users) {
              if (node._users.hasOwnProperty(id)) {
                node._users[id].status({
                  fill: 'red',
                  shape: 'ring',
                  text: 'node-red:common.status.disconnected'
                })
              }
            }
          } else if (node._connecting) {
            node.log('Connect failed')
          }
        })
      }
    }

    this.registerUserNode = function (userNode) {
      node._users[userNode.id] = userNode
      if (Object.keys(node._users).length === 1) {
        node._connect()
      }
    }

    this.unregisterUserNode = function (userNode, done) {
      delete node._users[userNode.id]
      if (node._closing) {
        return done()
      }
      if (Object.keys(node._users).length === 0) {
        if (node._client && node._client.connected) {
          return node._client.disconnect(done)
        } else {
          node._client.disconnect()
          return done()
        }
      }
      done()
    }

    this.addEventCallback = function (topic, callback) {
      node._client.addEventCallback(topic, callback)
    }

    this.removeEventCallback = function (topic, callback) {
      if (!node._closing) {
        node._client.removeEventCallback(topic, callback)
      }
    }

    this.asyncRequest = function (request, responseCallback) {
      node._client.asyncRequest(request, responseCallback)
    }

    this.sendEvent = function (event) {
      node._client.sendEvent(event)
    }

    this.sendResponse = function (response) {
      node._client.sendResponse(response)
    }

    this.registerService = function (serviceType, callbacksByTopic) {
      var serviceInfo = new dxl.ServiceRegistrationInfo(node._client,
          serviceType)
      serviceInfo.addTopics(callbacksByTopic)
      node._client.registerServiceAsync(serviceInfo)
      return serviceInfo
    }

    this.unregisterService = function (serviceRequestInfo) {
      node._client.unregisterServiceAsync(serviceRequestInfo)
    }

    this.on('close', function (done) {
      node._closing = true
      if (this.connected) {
        node._client.once('close', function () { done() })
      }
      node._client.destroy()
      if (!this.connected) {
        done()
      }
    })
  }

  RED.nodes.registerType('dxl-client', DxlClientNode)
}
