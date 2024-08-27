'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

const nodeRedTestHelper = require('node-red-node-test-helper')

const CLIENT_CONFIG_FILE = 'client_config.cfg'

module.exports = {
  getTestClientConfigFile: function () {
    const configDirs = [__dirname, os.homedir()]
    let configFile = null

    configDirs.forEach(function (configDir) {
      const candidateConfigFile = path.join(configDir, CLIENT_CONFIG_FILE)
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
  loadNodeRed: function (testNode, testFlows, callbackFunction, resultFunction) {
    nodeRedTestHelper._nodeModules = {} // bug fix for unit tests.. fixes catch already loaded
    nodeRedTestHelper.load(testNode, testFlows, function () {
      module.exports.forwardOnError(callbackFunction, resultFunction)
    })
  },
  dumpNodeRedLog: function () {
    console.log('Error, dumping Node RED log: ' +
      nodeRedTestHelper.log().getCalls())
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
      payload,
      payloadType,
      once: true,
      wires: [wires]
    }
  },
  getClientNodeConfig: function (id) {
    return {
      id,
      configFile: module.exports.getTestClientConfigFile(),
      name: 'client',
      type: 'dxl-client'
    }
  }
}
