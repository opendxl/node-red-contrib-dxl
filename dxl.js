'use strict'

module.exports = function (RED) {
  var dxl = require('@opendxl/dxl-client')

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

  function convertPayloadToReturnType (node, payload) {
    if (node.ret !== 'bin') {
      payload = payload.toString('utf8')
      if (node.ret === 'obj') {
        try {
          payload = JSON.parse(payload)
        } catch (e) {
          node.warn('Error converting dxl payload to json')
        }
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
        this.client.register(this)
        var eventCallback = function (event) {
          var payload = convertPayloadToReturnType(node, event.payload)
          var msg = {topic: event.topic, payload: payload}
          node.send(msg)
        }
        this.client.addEventCallback(this.topic, eventCallback)
        this.on('close', function (done) {
          node.client.removeEventCallback(node.topic, eventCallback)
          node.client.deregister(node, done)
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

  function DxlEventOutNode (config) {
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
            if (this.client.connected) {
              this.client.sendEvent(event)
            } else {
              this.error('Unable to send event, not connected')
            }
          }
        })
        this.on('close', function (done) {
          node.client.deregister(node, done)
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

  RED.nodes.registerType('dxl-event out', DxlEventOutNode)

  function DxlRequestNode (config) {
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
        this.client.register(this)
        this.on('input', function (msg) {
          if (msg.hasOwnProperty('payload')) {
            var request = new dxl.Request(node.topic)
            request.payload = convertPayloadToString(msg.payload)
            if (node.client.connected) {
              this.client.asyncRequest(request,
                  function (error, response) {
                    if (error) {
                      msg.payload = ''
                      msg.error = error.message
                      if (error instanceof dxl.MessageError) {
                        msg.errorCode = error.code
                      }
                    } else {
                      msg.payload = convertPayloadToReturnType(node,
                          response.payload)
                    }
                    node.send(msg)
                  }
              )
            } else {
              this.error('Unable to send request, not connected')
            }
          }
        })
        this.on('close', function (done) {
          node.client.deregister(node, done)
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
