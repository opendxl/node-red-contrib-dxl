'use strict'

var testNode = require('../../nodes/dxl-client')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('./test-helpers')

describe('dxl-client node', function () {
  before(function (done) {
    nodeRedTestHelper.startServer(done)
  })

  afterEach(function () {
    nodeRedTestHelper.unload()
  })

  after(function (done) {
    nodeRedTestHelper.stopServer(done)
  })

  it('should be loaded', function (done) {
    var testFlows = [
      {
        configFile: testHelpers.getTestClientConfigFile(),
        id: 'dxl.clientId',
        name: 'client',
        type: 'dxl-client',
        keepAliveInterval: '123',
        reconnectDelay: '16'
      }
    ]
    testHelpers.loadNodeRed(testNode, testFlows, function () {
      var clientNode = nodeRedTestHelper.getNode('dxl.clientId')
      clientNode.should.have.property('name', 'client')
      var clientConfig = clientNode.dxlClient.config
      clientConfig.keepAliveInterval.should.be.equal(123)
      clientConfig.reconnectDelay.should.be.equal(16)
      done()
    }, done)
  })
})
