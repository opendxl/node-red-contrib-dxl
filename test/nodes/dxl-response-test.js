'use strict'

var should = require('should')
var dxlClientNode = require('../../nodes/dxl-client')
var testNode = require('../../nodes/dxl-response')
var nodeRedTestHelper = require('node-red-node-test-helper')
var testHelpers = require('./test-helpers')

describe('dxl-core-response node', function () {
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
    var responseNodeId = 'dxl.responseId'

    var testFlows = [
      testHelpers.getClientNodeConfig(clientNodeId),
      {
        id: responseNodeId,
        name: 'my response',
        type: 'dxl-core-response',
        client: clientNodeId
      }
    ]
    testHelpers.loadNodeRed(
      [dxlClientNode, testNode],
      testFlows,
      function () {
        var responseOutNode = nodeRedTestHelper.getNode(responseNodeId)
        responseOutNode.should.have.property('name', 'my response')
        var clientNode = nodeRedTestHelper.getNode(clientNodeId)
        should(clientNode).not.be.null()
        done()
      }, done)
  })
})
