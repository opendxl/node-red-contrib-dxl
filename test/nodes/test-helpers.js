'use strict'

var fs = require('fs')
var os = require('os')
var path = require('path')

var nodeRedHelper = require('../node-red-helper')

var CLIENT_CONFIG_FILE = 'client_config.cfg'

module.exports = {
  getTestClientConfigFile: function () {
    var configDirs = [ __dirname, os.homedir() ]
    var configFile = null

    configDirs.forEach(function (configDir) {
      var candidateConfigFile = path.join(configDir, CLIENT_CONFIG_FILE)
      if (fs.existsSync(candidateConfigFile)) {
        configFile = candidateConfigFile
      }
    })

    if (!configFile) {
      throw new Error(
        'Unable to locate client config file at ' +
        path.join(configDirs[0], CLIENT_CONFIG_FILE))
    }

    return configFile
  },
  forwardOnError: function (callbackFunction, resultFunction) {
    try {
      callbackFunction(resultFunction)
    } catch (err) {
      resultFunction(err)
    }
  },
  loadNodeRed: function (testNode, testFlows,
                         callbackFunction, resultFunction) {
    nodeRedHelper.load(testNode, testFlows, function () {
      module.exports.forwardOnError(callbackFunction, resultFunction)
    })
  },
  dumpNodeRedLog: function () {
    console.log('Error, dumping Node RED log: ' +
      nodeRedHelper.log().getCalls())
  },
  getInjectNodeConfig: function (payload, wires, payloadType) {
    if (typeof wires === 'string') {
      wires = [wires]
    }
    if (typeof payloadType === 'undefined') {
      payloadType = 'txt'
    }
    return {
      id: (1 + Math.random() * 4294967295).toString(16),
      type: 'inject',
      payload: payload,
      payloadType: payloadType,
      once: true,
      wires: [wires]
    }
  },
  getClientNodeConfig: function (id) {
    return {
      id: id,
      configFile: module.exports.getTestClientConfigFile(),
      name: 'client',
      type: 'dxl-client'
    }
  }
}
