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

  function convertPayloadToReturnType (returnType, payload) {
    if (returnType !== 'bin') {
      payload = payload.toString('utf8')
      if (returnType === 'obj') {
        payload = JSON.parse(payload)
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
          var msg = { topic: event.topic }
          try {
            msg.payload = convertPayloadToReturnType(node.ret, event.payload)
            node.send(msg)
          } catch (e) {
            msg.payload = event.payload
            node.error('Error converting event to ' + node.ret +
                '. Error: ' + e.message + ', Payload: ' + event.payload, msg)
          }
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
      this.client.register(this)
      this.on('input', function (msg) {
        if (msg.hasOwnProperty('payload')) {
          var topic = node.topic || msg.dxlTopic
          if (topic) {
            var event = new dxl.Event(topic)
            event.payload = convertPayloadToString(msg.payload)
            if (this.client.connected) {
              this.client.sendEvent(event)
            } else {
              this.error('Unable to send event, not connected')
            }
          } else {
            this.error('Unable to send event, no topic available')
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
      this.client.register(this)
      this.on('input', function (msg) {
        if (msg.hasOwnProperty('payload')) {
          var topic = node.topic || msg.dxlTopic
          if (topic) {
            var request = new dxl.Request(topic)
            request.payload = convertPayloadToString(msg.payload)
            if (node.client.connected) {
              this.client.asyncRequest(request,
                  function (error, response) {
                    if (error) {
                      var errorMessage = error.message
                      if (error instanceof dxl.MessageError) {
                        if (errorMessage) {
                          errorMessage = errorMessage + ' '
                        }
                        errorMessage = errorMessage + '(' + error.code + ')'
                        msg.payload = error.detail.payload
                      }
                      node.error(errorMessage, msg)
                    } else {
                      try {
                        msg.payload = convertPayloadToReturnType(node.ret,
                            response.payload)
                        node.send(msg)
                      } catch (e) {
                        node.error('Error converting response to ' + node.ret +
                            '. Error: ' + e.message +
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
      this.error('Missing client configuration')
    }
  }

  RED.nodes.registerType('dxl request', DxlRequestNode)

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
              var msg = {topic: request.destinationTopic, dxlRequest: request}
              var canConvert = true
              var outputMessages = []
              for (var j = 0; j < node.rules.length; j += 1) {
                if (j === counter) {
                  try {
                    msg.payload = convertPayloadToReturnType(
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

  function DxlResponseNode (config) {
    RED.nodes.createNode(this, config)
    this.client = RED.nodes.getNode(config.client)

    var node = this

    if (this.client) {
      this.status({
        fill: 'red',
        shape: 'ring',
        text: 'node-red:common.status.disconnected'
      })
      this.client.register(this)
      this.on('input', function (msg) {
        if (msg.hasOwnProperty('payload') &&
            msg.hasOwnProperty('dxlRequest')) {
          var response
          if (msg.hasOwnProperty('error') &&
              msg.error.hasOwnProperty('message')) {
            var errorMessage = msg.error.message
            var errorCode = 0
            var errorMessageParts = errorMessage.match(/(.*)\((.*)\)/)
            if (errorMessageParts) {
              errorMessage = errorMessageParts[1]
              errorCode = errorMessageParts[2]
            }
            response = new dxl.ErrorResponse(msg.dxlRequest, errorCode,
                errorMessage)
            response.payload = msg.payload
          } else {
            response = new dxl.Response(msg.dxlRequest)
            response.payload = convertPayloadToString(msg.payload)
          }
          if (this.client.connected) {
            this.client.sendResponse(response)
          } else {
            this.error('Unable to send response, not connected')
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
      this.error('Missing client configuration')
    }
  }

  RED.nodes.registerType('dxl-response out', DxlResponseNode)
}
