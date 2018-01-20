'use strict'

var dxl = require('@opendxl/dxl-client')

module.exports = function (RED) {
  function DxlClientNode (config) {
    RED.nodes.createNode(this, config)

    this.client = new dxl.Client(dxl.Config.createDxlConfigFromFile(
        config.configfile))

    this.connected = false
    this.connecting = false
    this.closing = false

    var node = this
    this.users = {}

    this.register = function (dxlNode) {
      node.users[dxlNode.id] = dxlNode
      if (Object.keys(node.users).length === 1) {
        node.connect()
      }
    }

    this.deregister = function (dxlNode, done) {
      delete node.users[dxlNode.id]
      if (node.closing) {
        return done()
      }
      if (Object.keys(node.users).length === 0) {
        if (node.client && node.client.connected) {
          return node.client.disconnect(done)
        } else {
          node.client.disconnect()
          return done()
        }
      }
      done()
    }

    this.connect = function () {
      if (!node.connected && !node.connecting) {
        node.connecting = true
        node.client.connect()
        node.client.setMaxListeners(0)
        // Register successful connect or reconnect handler
        node.client.on('connect', function () {
          node.connecting = false
          node.connected = true
          for (var id in node.users) {
            if (node.users.hasOwnProperty(id)) {
              node.users[id].status({
                fill: 'green',
                shape: 'dot',
                text: 'node-red:common.status.connected'
              })
            }
          }
        })
        node.client.on('reconnect', function () {
          for (var id in node.users) {
            if (node.users.hasOwnProperty(id)) {
              node.users[id].status({
                fill: 'yellow',
                shape: 'ring',
                text: 'node-red:common.status.connecting'
              })
            }
          }
        })
        // Register disconnect handlers
        node.client.on('close', function () {
          if (node.connected) {
            node.connected = false
            for (var id in node.users) {
              if (node.users.hasOwnProperty(id)) {
                node.users[id].status({
                  fill: 'red',
                  shape: 'ring',
                  text: 'node-red:common.status.disconnected'
                })
              }
            }
          } else if (node.connecting) {
            node.log('Connect failed')
          }
        })
      }
    }

    this.addEventCallback = function (topic, callback) {
      node.client.addEventCallback(topic, callback)
    }

    this.removeEventCallback = function (topic, callback) {
      if (!node.closing) {
        node.client.removeEventCallback(topic, callback)
      }
    }

    this.asyncRequest = function (request, responseCallback) {
      node.client.asyncRequest(request, responseCallback)
    }

    this.sendEvent = function (event) {
      node.client.sendEvent(event)
    }

    this.sendResponse = function (response) {
      node.client.sendResponse(response)
    }

    this.registerService = function (serviceType, callbacksByTopic) {
      var serviceInfo = new dxl.ServiceRegistrationInfo(node.client,
          serviceType)
      serviceInfo.addTopics(callbacksByTopic)
      node.client.registerServiceAsync(serviceInfo)
      return serviceInfo
    }

    this.unregisterService = function (serviceRequestInfo) {
      node.client.unregisterServiceAsync(serviceRequestInfo)
    }

    this.on('close', function (done) {
      node.closing = true
      if (this.connected) {
        node.client.once('close', function () { done() })
      }
      node.client.destroy()
      if (!this.connected) {
        done()
      }
    })
  }

  RED.nodes.registerType('dxl-client', DxlClientNode)
}
