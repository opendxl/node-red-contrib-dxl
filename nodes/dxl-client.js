/**
 * @module DxlClient
 * @description Implementation of the `dxl-client` node
 */

'use strict'

var fs = require('fs')
var path = require('path')

var dxl = require('@opendxl/dxl-client')
var Client = dxl.Client
var Config = dxl.Config
var ServiceRegistrationInfo = dxl.ServiceRegistrationInfo
var NodeUtils = require('../lib/node-utils')

var DEFAULT_CONFIG_FILE_NAME = 'dxlclient.config'

/**
 * @classdesc Responsible for all communication with the
 * Data Exchange Layer (DXL) fabric.
 * @external DxlClient
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html}
 */

/**
* @classdesc Event messages are sent using the {@link DxlClient#sendEvent} method
*   of a client instance. Event messages are sent by one publisher and received
*   by one or more recipients that are currently subscribed to the topic
 *  associated with the event (otherwise known as one-to-many).
* @external Event
* @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Event.html}
*/

/**
 * @classdesc Request messages are used when invoking a method on a remote
 *   service. This communication is one-to-one where a client sends a request to
 *   a service instance and in turn receives a response.
 * @external Request
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Request.html}
 */

/**
 * @classdesc Response messages are sent by service instances upon
 *   receiving [Request]{@link external:Request} messages. This communication is
 *   one-to-one where a client sends a request to a service instance and in turn
 *   receives a response.
 * @external Response
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Response.html}
 */

/**
 * @classdesc Service registration instances are used to register and expose
 *   services onto a DXL fabric.
 * @external ServiceRegistrationInfo
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/ServiceRegistrationInfo.html}
 */

/**
 * @classdesc A general Data Exchange Layer (DXL) exception.
 * @external DxlError
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/DxlError.html}
 */

module.exports = function (RED) {
  /**
   * @classdesc Client configuration node responsible for establishing
   * communication with the Data Exchange Layer (DXL) fabric.
   * @param {Object} nodeConfig - Configuration data which the node uses.
   * @param {String} nodeConfig.configFile - Path to the DXL client
   *   configuration file. If this value is a directory, the node will attempt
   *   to load a file named `dxlclient.config` within the directory.
   * @param {Number} nodeConfig.keepAliveInterval - The maximum period in
   *   seconds between communications with a connected broker. If no other
   *   messages are being exchanged, this controls the rate at which the client
   *   will send ping messages to the broker.
   * @param {Number} nodeConfig.reconnectDelay - The delay between
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
    clientConfig.keepAliveInterval = NodeUtils.valueToNumber(
      nodeConfig.keepAliveInterval, 1800)
    clientConfig.reconnectDelay = NodeUtils.valueToNumber(
      nodeConfig.reconnectDelay, 1)

    /**
     * Whether or not the client is currently connected to the DXL fabric.
     * @type {boolean}
     */
    this.connected = false

    /**
     * Handle to the underlying DXL client object
     * @type {external:DxlClient}
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
     * callback will be invoked when [DxlClient]{@link external:DxlClient}
     * messages are received by the client on the specified topic.
      * @param {String} topic - Topic to receive
     *   [DxlClient]{@link external:DxlClient} messages on. An empty string or
     *   null value indicates that the callback should receive messages for all
     *   topics (no filtering).
     * @param {Function} eventCallback - Callback function which should be
     *   invoked for a matching message. The first argument passed to the
     *   callback function is the [Event]{@link external:Event} object.
     */
    this.addEventCallback = function (topic, eventCallback) {
      node.dxlClient.addEventCallback(topic, eventCallback)
    }

    /**
     * Removes an event callback from the client for the specified topic. This
     * method must be invoked with the same arguments as when the callback was
     * originally registered via
     * [addEventCallback]{@link module:DxlClient~DxlClientNode#addEventCallback}.
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
     * Sends a [Request]{@link external:Request} message to a remote DXL service
     * asynchronously. An optional response callback can be specified. This
     * callback will be invoked when the corresponding
     * [Response]{@link external:Response} message is received by the client.
     * @param {external:Request} request - The request message to send to a
     *   remote DXL service.
     * @param {Function} [responseCallback] - An optional response callback
     *   that will be invoked when the corresponding
     *   [Response]{@link external:Response} message is received by the client.
     * @throws {external:DxlError} If no prior attempt has been made to connect
     *   the client. This could occur if no prior call has been made to
     *   [registerUserNode]{@link module:DxlClient~DxlClientNode#registerUserNode}.
     */
    this.asyncRequest = function (request, responseCallback) {
      node.dxlClient.asyncRequest(request, responseCallback)
    }

    /**
     * Attempts to deliver the specified [Event]{@link external:Event} message
     * to the DXL fabric.
     * @param {external:Event} event - The {@link external:Event} to send.
     * @throws {external:DxlError} If no prior attempt has been made to connect
     *   the client. This could occur if no prior call has been made to
     *   [registerUserNode]{@link module:DxlClient~DxlClientNode#registerUserNode}.
     */
    this.sendEvent = function (event) {
      node.dxlClient.sendEvent(event)
    }

    /**
     * Attempts to deliver the specified [Response]{@link external:Response}
     * message to the DXL fabric. The fabric will in turn attempt to deliver the
     * response back to the client who sent the corresponding
     * [Request]{@link external:Request}.
     * @param {external:Response} response - The
     *   [Response]{@link external:Response} to send.
     * @throws {external:DxlError} If no prior attempt has been made to connect
     *   the client. This could occur if no prior call has been made to
     *   [registerUserNode]{@link module:DxlClient~DxlClientNode#registerUserNode}.
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
     *   contain the function to be invoked when a
     *   [Request]{@link external:Request} message is received. The
     *   [Request]{@link external:Request} object is supplied as the only
     *   parameter to the request callback function.
     * @returns {external:ServiceRegistrationInfo} An object containing
     *   information for the registered service. This value should be supplied
     *   in the corresponding call to
     *   [unregisterServiceAsync]{@link module:DxlClient~DxlClientNode#unregisterServiceAsync}.
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
     * specified
     * [ServiceRegistrationInfo]{@link external:ServiceRegistrationInfo}
     * instance contains information about the service that is to be removed.
     * @param {external:ServiceRegistrationInfo} serviceRegInfo - A
     *   [ServiceRegistrationInfo]{@link external:ServiceRegistrationInfo}
     *   instance containing information about the service that is to be
     *   unregistered.
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
