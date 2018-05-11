'use strict'

var should = require('should')
var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-request')
var nodeRedHelper = require('../node-red-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-request node', function () {
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
        var requestNode = nodeRedHelper.getNode(requestNodeId)
        requestNode.should.have.property('name', 'my request')
        requestNode.should.have.property('_returnType', 'bin')
        var clientNode = nodeRedHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
