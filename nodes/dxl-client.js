'use strict'

var fs = require('fs')
var path = require('path')

var dxl = require('@opendxl/dxl-client')
var Client = dxl.Client
var Config = dxl.Config
var ServiceRegistrationInfo = dxl.ServiceRegistrationInfo

var DEFAULT_CONFIG_FILE_NAME = 'dxlclient.config'

module.exports = function (RED) {
  /**
   * Convert the supplied value into a number.
   * @param value - The value to convert.
   * @param {Number} defaultValue - If the value parameter is undefined, return
   *   the value for this parameter.
   * @returns {Number} The converted value.
   * @private
   */
  function convertValueToNumber (value, defaultValue) {
    if (typeof value === 'undefined') {
      value = defaultValue
    } else if (typeof value === 'string') {
      value = Number(value)
    }
    return value
  }

  /**
   * @classdesc Node responsible for establishing communication with the Data
   * Exchange Layer (DXL) fabric.
   * @param {Object} nodeConfig - Configuration data which the node uses.
   * @param {String} nodeConfig.configFile - Directory path in which the
   *   DXL client configuration file should reside.
   * @param {Number|String} nodeConfig.keepAliveInterval - The maximum period in
   *   seconds between communications with a connected broker. If no other
   *   messages are being exchanged, this controls the rate at which the client
   *   will send ping messages to the broker.
   * @param {Number|String} nodeConfig.reconnectDelay - The delay between
   *   connection retry attempts in seconds.
   * @constructor
   */
  function DxlClientNode (nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)

    var configFile = nodeConfig.configFile
    if (fs.statSync(configFile).isDirectory()) {
      var configFileWithDefault = path.join(configFile,
        DEFAULT_CONFIG_FILE_NAME)
      if (fs.existsSync(configFileWithDefault)) {
        configFile = configFileWithDefault
      }
    }

    var clientConfig = Config.createDxlConfigFromFile(configFile)
    clientConfig.keepAliveInterval = convertValueToNumber(
      nodeConfig.keepAliveInterval, 1800)
    clientConfig.reconnectDelay = convertValueToNumber(
      nodeConfig.reconnectDelay, 1)

    /**
     * Whether or not the client is currently connected to the DXL fabric.
     * @type {boolean}
     */
    this.connected = false

    /**
     * Handle to the underlying DXL client object
     * @type {Client}
     */
    this.dxlClient = new Client(clientConfig)
    /**
     * Whether or not the DXL client is in the process of connecting to the
     * DXL fabric.
     * @type {boolean}
     * @private
     */
    this._connecting = false
    /**
     * Whether or not this node is in the process of being closed.
     * @type {boolean}
     * @private
     */
    this._closing = false
    /**
     * Object containing information about the nodes which are currently using
     * this configuration node. This is used to determine when it is necessary
     * to try to connect to the DXL fabric and to update the node's status as
     * the broker connection state changes. Each object's key is a node id and
     * corresponding value is the node object.
     * @type {boolean}
     * @private
     */
    this._users = {}

    var node = this

    /**
     * Attempts to connect the client to the DXL fabric.
     * @name DxlClientNode#_connect
     * @private
     */
    this._connect = function () {
      if (!node.connected && !node._connecting) {
        node._connecting = true
        node.dxlClient.connect()
        node.dxlClient.setMaxListeners(0)
        // Register successful connect or reconnect handler
        node.dxlClient.on('connect', function () {
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
        node.dxlClient.on('reconnect', function () {
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
        node.dxlClient.on('close', function () {
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

    /**
     * Register the supplied node as a "user" of the client config node. This is
     * used to determine when it is necessary to attempt to connect to the DXL
     * fabric and when the client could be disconnected (when no users are
     * remaining). The registered node's status method is called back upon in
     * order to update the node with the current status information for the
     * broker connection.
     * @param {Object} userNode - The node to register.
     */
    this.registerUserNode = function (userNode) {
      node._users[userNode.id] = userNode
      if (Object.keys(node._users).length === 1) {
        node._connect()
      }
    }

    /**
     * Unregister the supplied node as a "user" of the client config node. This
     * is used to determine when it is necessary to attempt to connect to the
     * DXL fabric and when the client could be disconnected (when no users are
     * remaining). The registered node's status method is called back upon in
     * order to update the node with the current status information for the
     * broker connection.
     */
    this.unregisterUserNode = function (userNode, done) {
      delete node._users[userNode.id]
      if (node._closing) {
        return done()
      }
      if (Object.keys(node._users).length === 0) {
        if (node.dxlClient && node.dxlClient.connected) {
          return node.dxlClient.disconnect(done)
        } else {
          node.dxlClient.disconnect()
          return done()
        }
      }
      done()
    }

    /**
     * Adds an event callback to the client for the specified topic. The
     * callback will be invoked when {@link Event} messages are received by
     * the client on the specified topic.
     * @param {String} topic - Topic to receive {@link Event} messages on.
     *   An empty string or null value indicates that the callback should
     *   receive messages for all topics (no filtering).
     * @param {Function} eventCallback - Callback function which should be
     *   invoked for a matching message. The first argument passed to the
     *   callback function is the {@link Event} object.
     */
    this.addEventCallback = function (topic, eventCallback) {
      node.dxlClient.addEventCallback(topic, eventCallback)
    }

    /**
     * Removes an event callback from the client for the specified topic. This
     * method must be invoked with the same arguments as when the callback was
     * originally registered via {@link DxlClientNode#addEventCallback}.
     * @param {String} topic - The topic to remove the callback for.
     * @param {Function} eventCallback - The event callback to be removed for
     *   the specified topic.
     */
    this.removeEventCallback = function (topic, eventCallback) {
      if (!node._closing) {
        node.dxlClient.removeEventCallback(topic, eventCallback)
      }
    }

    /**
     * Sends a {@link Request} message to a remote DXL service
     * asynchronously. An optional response callback can be specified. This
     * callback will be invoked when the corresponding {@link Response}
     * message is received by the client.
     * @param {Request} request - The request message to send to a remote
     *   DXL service.
     * @param {Function} [responseCallback=null] - An optional response callback
     *   that will be invoked when the corresponding {@link Response}
     *   message is received by the client.
     * @throws {DxlError} If no prior attempt has been made to connect the
     *   client. This could occur if no prior call has been made to
     *   {@link DxlClientNode#registerUserNode}.
     */
    this.asyncRequest = function (request, responseCallback) {
      node.dxlClient.asyncRequest(request, responseCallback)
    }

    /**
     * Attempts to deliver the specified {@link Event} message to the DXL
     * fabric.
     * @param {Event} event - The {@link Event} to send.
     * @throws {DxlError} If no prior attempt has been made to connect the
     *   client. This could occur if no prior call has been made to
     *   {@link DxlClientNode#registerUserNode}.
     */
    this.sendEvent = function (event) {
      node.dxlClient.sendEvent(event)
    }

    /**
     * Attempts to deliver the specified {@link Response} message to the DXL
     * fabric. The fabric will in turn attempt to deliver the response back to
     * the client who sent the corresponding {@link Request}.
     * @param {Response} response - The {@link Response} to send.
     * @throws {DxlError} If no prior attempt has been made to connect the
     *   client. This could occur if no prior call has been made to
     *   {@link DxlClientNode#registerUserNode}.
     */
    this.sendResponse = function (response) {
      node.dxlClient.sendResponse(response)
    }

    /**
     * Registers a DXL service with the fabric asynchronously.
     * @param {String} serviceType - A textual name for the service. For
     *   example, '/mycompany/myservice'.
     * @param {Object} callbacksByTopic - Object containing a set of topics for
     *   the service to respond to along with their associated request callback
     *   instances. Each key in the object should have a string representation
     *   of the topic name. Each corresponding value in the object should
     *   contain the function to be invoked when a {@link Request} message
     *   is received. The {@link Request} object is supplied as the only
     *   parameter to the request callback function.
     * @returns {ServiceRegistrationInfo} An object containing information
     *   for the registered service. This value should be supplied in the
     *   corresponding call to {@link DxlClientNode#unregisterServiceAsync}
     *   when the service should be unregistered.
     */
    this.registerServiceAsync = function (serviceType, callbacksByTopic) {
      var serviceInfo = new ServiceRegistrationInfo(node.dxlClient,
          serviceType)
      serviceInfo.addTopics(callbacksByTopic)
      node.dxlClient.registerServiceAsync(serviceInfo)
      return serviceInfo
    }

    /**
     * Unregisters (removes) a DXL service from the fabric asynchronously. The
     * specified {@link ServiceRegistrationInfo} instance contains
     * information about the service that is to be removed.
     * @param {ServiceRegistrationInfo} serviceRegInfo - A
     *   {@link ServiceRegistrationInfo} instance containing information
     *   about the service that is to be unregistered.
     */
    this.unregisterServiceAsync = function (serviceRegInfo) {
      node.dxlClient.unregisterServiceAsync(serviceRegInfo)
    }

    this.on('close', function (done) {
      node._closing = true
      if (this.connected) {
        node.dxlClient.once('close', function () { done() })
      }
      node.dxlClient.destroy()
      if (!this.connected) {
        done()
      }
    })
  }

  RED.nodes.registerType('dxl-client', DxlClientNode)
}
