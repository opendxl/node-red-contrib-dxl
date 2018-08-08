'use strict'

var should = require('should')
var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-request')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-request node', function () {
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
    var clientNodeId = 'dxl.clientId'
    var requestNodeId = 'dxl.requestId'
    var requestTopic = '/my/sample/topic'

    var testFlows = [
      testHelpers.getClientNodeConfig(clientNodeId),
      {
        id: requestNodeId,
        name: 'my request',
        type: 'dxl-core-request',
        topic: requestTopic,
        client: clientNodeId,
        returnType: 'bin',
        wires: []
      }
    ]
    testHelpers.loadNodeRed(
      [dxlClientNode, testNode],
      testFlows,
      function () {
        var requestNode = nodeRedTestHelper.getNode(requestNodeId)
        requestNode.should.have.property('name', 'my request')
        requestNode.should.have.property('_returnType', 'bin')
        var clientNode = nodeRedTestHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
