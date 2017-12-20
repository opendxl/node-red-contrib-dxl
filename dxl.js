'use strict'

module.exports = function (RED) {
  var dxl = require('dxl-client')
  var isUtf8 = require('is-utf8')

  function convertPayloadToString (payload) {
    if (!Buffer.isBuffer(payload)) {
      if (typeof payload === 'object') {
        payload = JSON.stringify(payload)
      } else if (typeof payload !== 'string') {
        payload = '' + payload
      }
    }
    return payload
  }

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
      node.client.removeEventCallback(topic, callback)
    }

    this.asyncRequest = function (request, responseCallback) {
      node.client.asyncRequest(request, responseCallback)
    }

    this.sendEvent = function (event) {
      if (node.connected) {
        node.client.sendEvent(event)
      }
    }

    this.on('close', function (done) {
      node.closing = true
      if (this.connected) {
        node.client.once('close', function () { done() })
        node.client.disconnect()
      } else if (node.connecting || node.client.reconnecting) {
        node.client.disconnect()
        done()
      } else {
        done()
      }
    })
  }

  RED.nodes.registerType('dxl-client', DxlClientNode)

  function DxlInNode (config) {
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
      if (this.topic) {
        this.client.register(this)
        this.client.addEventCallback(this.topic, function (event) {
          var payload = event.payload
          if (isUtf8(payload)) {
            payload = payload.toString()
          }
          var msg = {topic: event.topic, payload: payload}
          node.send(msg)
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

  RED.nodes.registerType('dxl in', DxlInNode)

  function DxlOutNode (config) {
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
      if (this.topic) {
        this.client.register(this)
        this.on('input', function (msg) {
          if (msg.hasOwnProperty('payload')) {
            var event = new dxl.Event(node.topic)
            event.payload = convertPayloadToString(msg.payload)
            this.client.sendEvent(event)
          }
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

  RED.nodes.registerType('dxl out', DxlOutNode)

  function DxlRequestNode (config) {
    RED.nodes.createNode(this, config)
    this.topic = config.topic
    this.client = RED.nodes.getNode(config.client)
    this.ret = config.ret || 'txt'

    var node = this

    if (this.client) {
      this.status({
        fill: 'red',
        shape: 'ring',
        text: 'node-red:common.status.disconnected'
      })
      if (this.topic) {
        this.client.register(this)
        this.on('input', function (msg) {
          if (msg.hasOwnProperty('payload')) {
            var request = new dxl.Request(node.topic)
            request.payload = convertPayloadToString(msg.payload)
            this.client.asyncRequest(request,
                function (response) {
                  msg.payload = response.payload
                  if (node.ret !== 'bin') {
                    msg.payload = msg.payload.toString('utf8')
                    if (node.ret === 'obj') {
                      try {
                        msg.payload = JSON.parse(msg.payload)
                      } catch (e) {
                        node.warn('Error converting dxl response to json')
                      }
                    }
                  }
                  node.send(msg)
                }
            )
          }
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

  RED.nodes.registerType('dxl request', DxlRequestNode)
}
