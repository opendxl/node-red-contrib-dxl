'use strict'

var testNode = require('../../nodes/dxl-client')
var nodeRedHelper = require('../node-red-helper')
var testHelpers = require('./test-helpers')

describe('dxl-client node', function () {
  before(function (done) {
    nodeRedHelper.startServer(done)
  })

  afterEach(function () {
    nodeRedHelper.unload()
  })

  after(function (done) {
    nodeRedHelper.stopServer(done)
  })

  it('should be loaded', function (done) {
    var testFlows = [
      {
        configfile: testHelpers.getTestClientConfigFile(),
        id: 'dxl.clientId',
        name: 'client',
        type: 'dxl-client',
        keepalive: 123,
        reconnectdelay: 16
      }
    ]
    testHelpers.loadNodeRed(testNode, testFlows, function () {
      var clientNode = nodeRedHelper.getNode('dxl.clientId')
      clientNode.should.have.property('name', 'client')
      var clientConfig = clientNode._client.config
      clientConfig.keepAliveInterval.should.be.equal(123)
      clientConfig.reconnectDelay.should.be.equal(16)
      done()
    }, done)
  })
})
